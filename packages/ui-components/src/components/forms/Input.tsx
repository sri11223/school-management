import React from 'react';

export interface InputProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  onChange?: (value: string) => void;
}

export const Input: React.FC<InputProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  onChange
}) => {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label htmlFor={name} style={{ display: 'block', marginBottom: '0.5rem' }}>
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          width: '100%',
          padding: '0.5rem',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}
      />
    </div>
  );
};

export const StudentNameInput: React.FC<Omit<InputProps, 'type'>> = (props) => {
  return <Input {...props} type="text" />;
};

export const PhoneInput: React.FC<Omit<InputProps, 'type'>> = (props) => {
  return <Input {...props} type="tel" placeholder="9876543210" />;
};

export const EmailInput: React.FC<Omit<InputProps, 'type'>> = (props) => {
  return <Input {...props} type="email" />;
};