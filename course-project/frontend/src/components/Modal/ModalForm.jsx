import { useState, useEffect } from 'react';
import {
  Box,
  Modal,
} from '@mui/material';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputDefault } from '../UI/Input';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 420,
  outline: 'none',
};



export default function ModalForm({ formTitle, formDescription, modalType, fields = [], open, setOpen, onSubmit, options = {} }) {
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
            if (field.multiNumber) {
                const raw = formData[field.name];

                // empty, so return empty array
                if (!raw || raw.trim() === "") {
                    finalData[field.name] = [];
                    return;
                }

                // otherwise parse normally
                finalData[field.name] = raw
                    .split(/[\s,]+/)
                    .map(Number)
                    .filter(n => !isNaN(n));
            }
        });

        if (onSubmit) onSubmit(finalData);

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

    // for select fields
    function convertToBoolean(v) {
        if (v === "true") return true;
        if (v === "false") return false;
        return v; // leave everything else unchanged
    }

    return (
        <div>
        <Modal open={open} onClose={handleClose}>
            <Box sx={modalStyle}>
                {/* Faded background */}
                <div
                    className="absolute inset-0 bg-black/40"
                    aria-hidden="true"
                    onClick={handleClose}
                />

                {/* Modal content */}
                <Card className="relative z-10 w-full max-w-lg bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden max-h-[80vh] flex flex-col">
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Close dialog"
                        className="absolute top-4 right-4 rounded-md p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition duration-150 group/button z-10"
                    >
                        <XMarkIcon className="size-5 transition-transform duration-150 group-hover/button:rotate-90" />
                    </button>

                    <CardHeader className="bg-white border-b border-gray-100 py-5 px-6 flex-shrink-0">
                        <CardTitle className="text-xl font-bold text-space-indigo-600">
                            {modalType ? `Enter ${modalType.charAt(0).toUpperCase() + modalType.slice(1)} Details` : 'Form'}
                        </CardTitle>
                        {formDescription && (
                            <p className="text-sm text-space-indigo-500 mt-1">
                                {formDescription}
                            </p>
                        )}
                    </CardHeader>

                    <CardContent className="px-6 py-6 overflow-y-auto flex-1">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {fields.map(f => (
                                <div key={f.name} className="flex flex-col">
                                    <label className="text-sm font-semibold text-strawberry-red-600 mb-2">
                                        {f.label}{f.required ? " *" : ""}
                                    </label>

                                    {f.type === "select" &&
                                        <Select value={formData[f.name]} onValueChange={(value) => {
                                            setFormData(prev => ({ ...prev, [f.name]: value }));
                                            setErrors(prev => ({ ...prev, [f.name]: "" }));
                                        }}>
                                            <SelectTrigger className="w-full border-gray-300 text-gray-900 focus:border-strawberry-red-500 focus:ring-strawberry-red-500">
                                                <SelectValue placeholder={`Select ${f.label}`} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {f.options?.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    }
                                    {f.type !== "select" &&
                                        <InputDefault
                                            type={f.type || "text"}
                                            name={f.name}
                                            value={formData[f.name]}
                                            onChange={handleChange}
                                        />
                                    }

                                    {errors[f.name] && (
                                        <span className="text-red-600 text-xs mt-1">
                                            {errors[f.name]}
                                        </span>
                                    )}
                                </div>
                            ))}

                            <Button 
                                type="submit"
                                className="w-full mt-6 bg-strawberry-red-500 text-white hover:bg-strawberry-red-600"
                            >
                                Submit
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </Box>
        </Modal>
        </div>
    );
}
