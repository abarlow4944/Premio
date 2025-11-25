import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

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

    return (
        <div>
        {/* <Button onClick={() => setOpen(true)}>Open {modalType}</Button> */}
        <Modal open={open} onClose={handleClose}>
            <Box sx={modalStyle}>
                {/* Close button */}
                <IconButton
                    onClick={handleClose}
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                >
                    <CloseIcon />
                </IconButton>

                <Typography variant="h6" component="h2">
                    Enter {modalType} details
                </Typography>

                <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
                    {fields.map(f => (
                        <div key={f.name} style={{ marginBottom: "12px" }}>
                            <label style={{ display: "block", marginBottom: 4 }}>
                                {f.label}{f.required ? " *" : ""}
                            </label>
                            <input
                                type={f.type || "text"}
                                name={f.name}
                                value={formData[f.name]}
                                onChange={handleChange}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    border: errors[f.name] ? "1px solid red" : "1px solid #ccc",
                                    borderRadius: "4px",
                                }}
                            />
                            {errors[f.name] && (
                                <span style={{ color: "red", fontSize: "0.8rem" }}>
                                    {errors[f.name]}
                                </span>
                            )}
                        </div>
                    ))}

                    <Button type="submit" variant="contained">
                        Submit
                    </Button>
                </form>
            </Box>
        </Modal>
        </div>
    );
}
