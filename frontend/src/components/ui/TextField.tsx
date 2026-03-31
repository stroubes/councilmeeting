import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react';

interface BaseFieldProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  id: string;
}

type TextFieldProps = BaseFieldProps &
  (
    | ({ as?: 'input' } & Omit<InputHTMLAttributes<HTMLInputElement>, 'as'>)
    | ({ as: 'textarea' } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'as'>)
    | ({ as: 'select' } & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'as'> & { children: React.ReactNode })
  );

const TextField = forwardRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, TextFieldProps>(
  ({ label, error, helperText, required, id, ...props }, ref) => {
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    return (
      <div className="form-field">
        <label htmlFor={id}>
          {label}
          {required ? (
            <span aria-hidden="true" style={{ color: 'var(--danger)', marginLeft: '0.25em' }}>
              *
            </span>
          ) : null}
        </label>
        {props.as === 'select' ? (
          <select
            id={id}
            ref={ref as React.Ref<HTMLSelectElement>}
            className={`field${error ? ' field-error' : ''}`}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            required={required}
            {...(props as Omit<SelectHTMLAttributes<HTMLSelectElement>, 'as'>)}
          >
            {props.children}
          </select>
        ) : props.as === 'textarea' ? (
          <textarea
            id={id}
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={`field${error ? ' field-error' : ''}`}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            required={required}
            {...(props as Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'as'>)}
          />
        ) : (
          <input
            id={id}
            ref={ref as React.Ref<HTMLInputElement>}
            className={`field${error ? ' field-error' : ''}`}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            required={required}
            {...(props as Omit<InputHTMLAttributes<HTMLInputElement>, 'as'>)}
          />
        )}
        {error ? (
          <span id={errorId} className="form-error" role="alert">
            {error}
          </span>
        ) : helperText ? (
          <span id={helperId} className="form-helper">
            {helperText}
          </span>
        ) : null}
      </div>
    );
  },
);

TextField.displayName = 'TextField';

export default TextField;