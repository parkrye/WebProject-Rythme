interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-silver text-sm mb-2">{label}</label>
      )}
      <input className={`input-field w-full ${className}`} {...props} />
    </div>
  );
};

export default Input;
