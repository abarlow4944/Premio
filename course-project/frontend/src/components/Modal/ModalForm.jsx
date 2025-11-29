import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Modal,
  IconButton,
  Card,
  CardContent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { InputDefault } from '../UI/Input';
import { Button } from "@/components/UI/button";

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 420,
  outline: 'none',
};



export default function ModalForm({ formTitle, formDescription, fields = [], open, setOpen, onSubmit }) {
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
                <Card sx={{ borderRadius: 3, boxShadow: 6 }}>
                    <CardContent sx={{ p: 3, position: "relative" }}>
                        
                        {/* Close Button */}
                        <IconButton
                            onClick={() => setOpen(false)}
                            sx={{ position: 'absolute', right: 12, top: 12 }}
                        >
                            <CloseIcon />
                        </IconButton>

                        {/* Form title and description */}
                        {formTitle &&
                            <h2 className="text-center text-lg font-semibold text-flag-red-500">
                                {formTitle}
                            </h2>
                        }

                        {formDescription &&
                            <h2 className="text-center text-sm text-space-indigo-500">
                                {formDescription}
                            </h2>
                        }
                        
                        <form onSubmit={handleSubmit} className="mt-5 overflow-y-auto max-h-[75vh]">
                            {fields.map(f => (
                                <div key={f.name} style={{ marginBottom: 16 }}>
                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        {f.label}{f.required ? " *" : ""}
                                    </Typography>
                                    {console.log("field is of type", f.type)}

                                    {f.type === "select" &&
                                        <select
                                            className="block w-full rounded-md mt-2 bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-strawberry-red-500 sm:text-sm/6"
                                            value={formData[f.name]}
                                            name={f.label}
                                            onChange={handleChange}
                                            >
                                            <option value="">Select</option>
                                            {f.options.map((o) => (
                                                <option key={o.label} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    }
                                    {f.type !== "select" &&
                                        <InputDefault
                                            type={f.type || "text"}
                                            name={f.label}
                                            value={formData[f.name]}
                                            onChange={handleChange}
                                            min={f.min}
                                            readOnly={f.readOnly}
                                        />
                                    }

                                    {errors[f.name] && (
                                        <Typography color="error" variant="caption">
                                            {errors[f.name]}
                                        </Typography>
                                    )}
                                </div>
                            ))}

                            <Button variant="default" type="submit" fullWidth sx={{ mt: 1 }} >
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
