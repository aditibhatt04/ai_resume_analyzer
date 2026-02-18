import {useState, useCallback} from 'react'
import {useDropzone} from 'react-dropzone'
import { formatSize } from '../lib/utils'

interface FileUploaderProps {
    onFileSelect?: (file: File | null) => void;
    error?: string | null;
}

const FileUploader = ({ onFileSelect, error }: FileUploaderProps) => {
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [displayedFile, setDisplayedFile] = useState<File | null>(null);
    
    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
        // Handle rejected files
        if (rejectedFiles.length > 0) {
            const rejection = rejectedFiles[0];
            if (rejection.errors[0]?.code === 'file-too-large') {
                setUploadError(`File too large. Maximum size is ${formatSize(20 * 1024 * 1024)}`);
            } else if (rejection.errors[0]?.code === 'file-invalid-type') {
                setUploadError('Only PDF files are allowed. Please upload a PDF resume.');
            } else {
                setUploadError('File upload failed. Please try again with a valid PDF.');
            }
            setDisplayedFile(null);
            onFileSelect?.(null);
            return;
        }
        
        const file = acceptedFiles[0] || null;
        setUploadError(null);
        setDisplayedFile(file);
        onFileSelect?.(file);
    }, [onFileSelect]);

    const maxFileSize = 20 * 1024 * 1024; // 20MB in bytes

    const {getRootProps, getInputProps} = useDropzone({
        onDrop,
        multiple: false,
        accept: { 'application/pdf': ['.pdf']},
        maxSize: maxFileSize,
    })

    const handleCancelFile = useCallback(() => {
        setUploadError(null);
        setDisplayedFile(null);
        onFileSelect?.(null);
    }, [onFileSelect]);



    return (
        <div className="w-full">
            {uploadError && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
                    <p className="text-sm text-red-900">
                        <strong>⚠️ Upload Error:</strong> {uploadError}
                    </p>
                </div>
            )}
            <div className="gradient-border">
                <div {...getRootProps()}>
                    <input {...getInputProps()} />

                    <div className="space-y-4 cursor-pointer">
                        {displayedFile ? (
                            <div className="uploader-selected-file" onClick={(e) => e.stopPropagation()}>
                                <img src="/images/pdf.png" alt="pdf" className="size-10" />
                                <div className="flex items-center space-x-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                                            {displayedFile.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {formatSize(displayedFile.size)}
                                        </p>
                                    </div>
                                </div>
                                <button className="p-2 cursor-pointer" onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelFile();
                                }}>
                                    <img src="/icons/cross.svg" alt="remove" className="w-4 h-4" />
                                </button>
                            </div>
                        ): (
                            <div>
                                <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
                                    <img src="/icons/info.svg" alt="upload" className="size-20" />
                                </div>
                                <p className="text-lg text-gray-500">
                                    <span className="font-semibold">
                                        Click to upload
                                    </span> or drag and drop
                                </p>
                                <p className="text-lg text-gray-500">PDF (max {formatSize(maxFileSize)})</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
export default FileUploader
