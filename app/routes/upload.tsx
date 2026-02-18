import {type FormEvent, useState} from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {generateUUID} from "~/lib/utils";
import {prepareInstructions} from "../../constants";

const Upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [tempResumeData, setTempResumeData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const resetForm = () => {
        setIsProcessing(false);
        setStatusText('');
        setFile(null);
        setError(null);
    };

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File  }) => {
        setIsProcessing(true);

        try {
            console.log('Starting analysis for file:', file.name);
            
            setStatusText('Uploading the file...');
            const uploadedFile = await fs.upload([file]);
            console.log('Uploaded file:', uploadedFile);
            console.log('Uploaded file type:', typeof uploadedFile);
            console.log('Uploaded file keys:', uploadedFile ? Object.keys(uploadedFile) : 'null');
            console.log('Uploaded file path:', uploadedFile?.path);
            
            if(!uploadedFile) {
                console.error('File upload failed - no result returned');
                setStatusText('Error: Failed to upload file');
                return;
            }

            // Verify file was uploaded by reading it back
            setStatusText('Verifying uploaded file...');
            try {
                const readBack = await fs.read(uploadedFile.path);
                console.log('File verification - Read back successful, size:', readBack?.size || 0);
            } catch (readError) {
                console.error('File verification - Failed to read back uploaded file:', readError);
            }

            setStatusText('Converting to image...');
            const imageFile = await convertPdfToImage(file);
            console.log('Converted to image:', imageFile);
            
            if(!imageFile.file) {
                console.error('PDF conversion failed:', imageFile.error);
                setStatusText(`Error: ${imageFile.error || 'Failed to convert PDF to image'}`);
                return;
            }

            setStatusText('Uploading the image...');
            const uploadedImage = await fs.upload([imageFile.file]);
            console.log('Uploaded image:', uploadedImage);
            
            if(!uploadedImage) {
                console.error('Image upload failed');
                setStatusText('Error: Failed to upload image');
                return;
            }

            setStatusText('Preparing data...');
            const uuid = generateUUID();
            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: uploadedImage.path,
                companyName, jobTitle, jobDescription,
                feedback: '',
            }
            console.log('Storing data with UUID:', uuid);
            await kv.set(`resume:${uuid}`, JSON.stringify(data));

            setStatusText('Analyzing... (this may take 30-60 seconds)');
            console.log('Starting AI analysis...');
            console.log('Passing to AI - Resume path:', uploadedFile.path);
            console.log('Image path:', uploadedImage.path);
            console.log('Job title:', jobTitle);
            console.log('Job description length:', jobDescription.length);

            let feedback;
            try {
                // Try using the image path instead of PDF for better AI readability
                feedback = await ai.feedback(
                    uploadedImage.path,
                    prepareInstructions({ jobTitle, jobDescription })
                )
            } catch (aiError) {
                console.error('AI feedback threw an error:', aiError);
                console.error('AI error details:', JSON.stringify(aiError, null, 2));
                throw aiError;
            }
            
            if (!feedback) {
                console.error('AI feedback failed - no response');
                setStatusText('Error: Failed to analyze resume - no response from AI');
                return;
            }

            console.log('Feedback received:', feedback);

            const feedbackText = typeof feedback.message.content === 'string'
                ? feedback.message.content
                : feedback.message.content[0].text;

            console.log('Feedback text:', feedbackText);
            console.log('Full AI response object:', JSON.stringify(feedback, null, 2));
            console.log('Attempting to parse JSON...');

            try {
                data.feedback = JSON.parse(feedbackText);
                console.log('Successfully parsed feedback:', data.feedback);
            } catch (parseError) {
                console.error('Failed to parse AI response as JSON:', parseError);
                console.error('Raw response that failed to parse:', feedbackText);
                console.error('Feedback object structure:', Object.keys(feedback));
                throw new Error(`AI returned invalid JSON: ${parseError instanceof Error ? parseError.message : 'Parse failed'}`);
            }
            
            // Only save to persistent storage if authenticated
            if(auth.isAuthenticated) {
                await kv.set(`resume:${uuid}`, JSON.stringify(data));
            } else {
                // Store temporarily in sessionStorage for unauthenticated users
                sessionStorage.setItem(`temp-resume:${uuid}`, JSON.stringify(data));
            }
            
            setStatusText('Analysis complete, redirecting...');
            console.log('Final data:', data);
            
            setTimeout(() => {
                if(auth.isAuthenticated) {
                    navigate(`/resume/${uuid}`);
                } else {
                    navigate(`/resume/${uuid}?temp=true`);
                }
            }, 500);
        } catch (error) {
            console.error('Error during analysis:', error);
            console.error('Error type:', typeof error);
            console.error('Error keys:', error && typeof error === 'object' ? Object.keys(error) : 'N/A');
            console.error('Error stringified:', JSON.stringify(error, null, 2));
            
            const errorMessage = error instanceof Error 
                ? error.message
                : (error && typeof error === 'object' && 'message' in error)
                    ? String(error.message)
                    : 'Processing failed. Check console for details.';
            
            setError(errorMessage);
            setIsProcessing(false);
        }
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if(!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        if(!file) return;

        handleAnalyze({ companyName, jobTitle, jobDescription, file });
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart feedback for your dream job</h1>
                    
                    {/* Error State */}
                    {error && (
                        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 my-6">
                            <h2 className="text-red-900 font-semibold mb-2 flex items-center gap-2">
                                <span className="text-2xl">❌</span>
                                Analysis Failed
                            </h2>
                            <p className="text-red-800 mb-4">{error}</p>
                            <button 
                                onClick={resetForm}
                                className="primary-button bg-red-600 hover:bg-red-700"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                    
                    {/* Processing State */}
                    {isProcessing && (
                        <>
                            <h2>{statusText}</h2>
                            <img src="/images/resume-scan.gif" className="w-full" />
                        </>
                    )}
                    
                    {/* Form State */}
                    {!isProcessing && !error && (
                        <>
                            <h2>Drop your resume for an ATS score and improvement tips</h2>
                    
                            {/* Info Banner for Unauthenticated Users */}
                            {!auth.isAuthenticated && (
                                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-blue-900">
                                        <strong>📌 Note:</strong> You're using Quick Analysis mode. Your results won't be saved. 
                                        <a href="/auth" className="font-semibold underline ml-1">Log in to save your analyses.</a>
                                    </p>
                                </div>
                            )}
                        
                            <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
                                <div className="form-div">
                                    <label htmlFor="company-name">Company Name</label>
                                    <input type="text" name="company-name" placeholder="Company Name" id="company-name" />
                                </div>
                                <div className="form-div">
                                    <label htmlFor="job-title">Job Title</label>
                                    <input type="text" name="job-title" placeholder="Job Title" id="job-title" />
                                </div>
                                <div className="form-div">
                                    <label htmlFor="job-description">Job Description</label>
                                    <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description" />
                                </div>

                                <div className="form-div">
                                    <label htmlFor="uploader">Upload Resume</label>
                                    <FileUploader onFileSelect={handleFileSelect} error={error} />
                                </div>

                                <button className="primary-button" type="submit">
                                    Analyze Resume
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </section>
        </main>
    )
}
export default Upload
