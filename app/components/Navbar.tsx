import {Link, useNavigate} from "react-router";
import {usePuterStore} from "~/lib/puter";

const Navbar = () => {
    const { auth } = usePuterStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await auth.signOut();
        navigate('/');
    };

    return (
        <nav className="navbar">
            <Link to="/">
                <p className="text-2xl font-bold text-gradient">RESUMIND</p>
            </Link>
            <div className="flex gap-4 items-center">
                {auth.isAuthenticated ? (
                    <>
                        <Link to="/upload" className="primary-button w-fit">
                            Upload Resume
                        </Link>
                        <button 
                            onClick={handleLogout}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-semibold rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <Link to="/upload" className="primary-button w-fit">
                        Upload Resume
                    </Link>
                )}
            </div>
        </nav>
    )
}
export default Navbar
