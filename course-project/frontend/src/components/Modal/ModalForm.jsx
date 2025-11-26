import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/UI/Card'

export default function ModalForm({ modalType, fields = [], open, setOpen, onSubmit }) {
    const [errors, setErrors] = useState({});

    const dataFields = Object.fromEntries(
        fields.map(f => [f.name, ""])
    );

    const [formData, setFormData] = useState(dataFields);

    useEffect(() => {
        const initData = Object.fromEntries(fields.map(f => [f.name, f.value ?? ""]));
        setFormData(initData);
        setErrors({});
    }, [fields, open]);

    const handleChange = (e) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
        setErrors(prev => ({ ...prev, [e.target.name]: "" }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        fields.forEach(field => {
            if (field.required && !formData[field.name].trim()) {
                newErrors[field.name] = `${field.label} is required`;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return; 
        }

        const finalData = {...formData};

        fields.forEach(field => {
            if(field.multiNumber){
                finalData[field.name] = formData[field.name]
                    .split(/[\s,]+/)
                    .map(Number)
                    .filter(n => !isNaN(n));
            }
        });

        if (onSubmit) onSubmit(finalData);

        console.log("Submitting... ", modalType, finalData);
        setOpen(false);
    };

    const handleClose = () => setOpen(false);

    // close on Escape
    useEffect(() => {
        if (!open) return;
        function onKey(e) {
            if (e.key === 'Escape') handleClose();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" aria-hidden="true" onClick={handleClose} />
            <Card className="relative z-10 w-full max-w-lg bg-white border border-gray-200 shadow-xl">
                <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Close dialog"
                    className="absolute top-4 right-4 rounded-md p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition duration-150 group/button"
                >
                    <XMarkIcon className="size-5 transition-transform duration-150 group-hover/button:rotate-90" />
                </button>

                <CardHeader className="flex flex-row items-start gap-4 pt-6 pr-12">
                    <CardTitle className="text-lg">Enter {modalType} details</CardTitle>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {fields.map(f => (
                            <div key={f.name}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}{f.required ? ' *' : ''}</label>
                                <input
                                    type={f.type || 'text'}
                                    name={f.name}
                                    value={formData[f.name] ?? ''}
                                    onChange={handleChange}
                                    className={`w-full rounded-md border p-2 text-sm ${errors[f.name] ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors[f.name] && (
                                    <p className="text-xs text-red-600 mt-1">{errors[f.name]}</p>
                                )}
                            </div>
                        ))}

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="mr-2 rounded-md px-3 py-1 text-sm font-medium border border-platinum-500 text-space-indigo-500 hover:bg-platinum-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="rounded-md px-3 py-2 text-sm font-medium bg-[var(--color-space-indigo-500)] text-white"
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
