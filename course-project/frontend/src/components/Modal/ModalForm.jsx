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



export default function ModalForm({ formTitle, formDescription, modalType, fields = [], open, setOpen, onSubmit }) {
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
                console.log("multi-input started")
                finalData[field.name] = formData[field.name]
                    .split(/[\s,]+/)
                    .map(Number)
                    .filter(n => !isNaN(n));
                console.log("MULTI INPUT:", finalData[field.name])
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
        <div>
        {/* <Button onClick={() => setOpen(true)}>Open {modalType}</Button> */}
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

                        {modalType &&
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                Enter {modalType} Details
                            </Typography>
                        }

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
                        
                        <form onSubmit={handleSubmit}>
                            {fields.map(f => (
                                <div key={f.name} style={{ marginBottom: 16 }}>
                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        {f.label}{f.required ? " *" : ""}
                                    </Typography>

                                    <InputDefault
                                        type={f.type || "text"}
                                        name={f.name}
                                        value={formData[f.name]}
                                        onChange={handleChange}
                                        
                                    />

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
