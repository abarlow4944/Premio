import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Modal,
  IconButton
} from '@mui/material';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { InputDefault } from '../ui/Input';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 420,
  outline: 'none',
};



export default function ModalForm({ formTitle, formDescription, modalType, fields = [], open, setOpen, onSubmit, currentFilterKey, setColumnFilters, options = {} }) {
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
        fields.forEach(f => {
            const value = formData[f.name];
            if (f.required && (value === "" || value === null || value === undefined)) {
                newErrors[f.name] = `${f.label} is required`;
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
                    className="absolute inset-0 "
                    aria-hidden="true"
                    onClick={handleClose}
                />

                {/* Modal content */}
                <Card className="relative z-10 w-full max-w-lg bg-white border border-gray-200 shadow-xl rounded-2xl overflow-y-auto max-h-[80vh] flex flex-col">
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Close dialog"
                        className="absolute top-4 right-4 rounded-md p-2 hover:cursor-pointer text-gray-400 hover:text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition duration-150 group/button z-10"
                    >
                        <XMarkIcon className="size-5 transition-transform duration-150 group-hover/button:rotate-90" />
                    </button>

                    <CardHeader className="bg-white border-b border-gray-100 py-5 px-6 flex-shrink-0">
                        <CardTitle className="text-xl font-bold text-space-indigo-600">
                            {formTitle || (modalType ? `Enter ${modalType.charAt(0).toUpperCase() + modalType.slice(1)} Details` : 'Form')}
                        </CardTitle>
                        {formDescription && (
                            <p className="text-sm text-space-indigo-500 mt-1">
                                {formDescription}
                            </p>
                        )}

                    </CardHeader>
                    <CardContent sx={{ p: 3, position: "relative" }}>
                        <form onSubmit={handleSubmit}>
                            {fields.map(f => (
                                <div key={f.name} style={{ marginBottom: 16 }}>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    {f.label}{f.required ? " *" : ""}
                                </Typography>


                                {f.type === "select" ? (
                                    <SelectField
                                        field={f}
                                        value={formData[f.name]}
                                        onChange={v => setFormData(prev => ({ ...prev, [f.name]: v }))}
                                        options={options}
                                    />
                                ) : f.type === "radio" ? (
                                    <div>
                                    {f.options.map(opt => (
                                        <label key={opt.value} style={{ marginRight: 12 }}>
                                        <input
                                            type="radio"
                                            name={f.name}
                                            value={opt.value}
                                            checked={formData[f.name] === opt.value}
                                            onChange={(e) =>
                                            setFormData(prev => ({ ...prev, [f.name]: e.target.value }))
                                            }
                                        />
                                        {opt.label}
                                        </label>
                                    ))}
                                    </div>
                                ) : (
                                    <InputDefault
                                    type={f.type || "text"}
                                    name={f.name}
                                    value={formData[f.name]}
                                    onChange={handleChange}
                                    placeholder={f.multiNumber ? "Enter numbers separated by commas or spaces" : ""}
                                    readOnly={f.readOnly}
                                    />
                                )}
                                {errors[f.name] && (
                                    <Typography color="error" variant="caption">
                                    {errors[f.name]}
                                    </Typography>
                                )}
                                </div>
                            ))}

                            <div className="flex justify-end gap-2 mt-4">
                                {modalType === "filter" && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                    const clearedData = {};
                                    fields.forEach(f => (clearedData[f.name] = ""));
                                    setFormData(clearedData);

                                    if (currentFilterKey) {
                                        setColumnFilters(prev => ({
                                        ...prev,
                                        [currentFilterKey]: undefined,
                                        }));
                                    }

                                    setOpen(false);
                                    }}
                                >
                                    Reset
                                </Button>
                                )}

                                <Button variant="default" type="submit" fullWidth sx={{ mt: 1 }}>
                                Submit
                                </Button>
                            </div>
                            </form>

                    </CardContent>
                </Card>
            </Box>
        </Modal>
        </div>
    );
}

function SelectField({ field, value, onChange, options }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={`Select ${field.label}`} />
      </SelectTrigger>
      <SelectContent>
        {options[field.name]?.map(opt => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
