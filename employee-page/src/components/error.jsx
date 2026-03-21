
import {AiOutlineCloseCircle} from 'react-icons/ai'
const ErrorMessage = ({ msg ,onClose}) => {
  if (!msg) return null;

  return (
    <div className= "flex items-center w-full max-w-md bg-gray-100 shadow-md rounded-lg overflow-hidden mb-4 border border-gray-200">
      <div className="w-1.5 bg-red-600 self-stretch"></div>
      <div className="px-4 py-3 flex-1">
        <p className="text-sm font-semibold text-gray-800">
          Error
        </p>
        <p className="text-xs text-gray-600">
          {msg}
        </p>
      </div>

      <div className="px-3">
        <AiOutlineCloseCircle 
          onClick={onClose} 
          className="text-gray-400 text-xl hover:text-red-500 cursor-pointer transition-colors" 
        />
      </div>
    </div>
  );
};

export default ErrorMessage;