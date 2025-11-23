import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';

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

export default function ModalForm({modalType, fields = []}) {
    const [open, setOpen] = useState(false);

    const dataFields = Object.fromEntries(
        fields.map(f => [f.name, ""])
    );

    const [formData, setFormData] = useState(dataFields);

    useEffect(() => {
        setFormData(dataFields);
    }, [fields]);

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const finalData = {...formData};

        fields.forEach(field => {
            if(field.multiNumber){
                finalData[field.name] = formData[field.name]
                    .split(/[\s,]+/)
                    .map(Number)
                    .filter(n => !isNaN(n));
            }
        });

        console.log("Submitting... ", modalType, finalData);
        setOpen(false);
    };

    const handleClose = () => setOpen(false);
    
    return (
        <div>
        <Button onClick={() => setOpen(true)}>Open {modalType}</Button>
        <Modal
            open={open}
            onClose={handleClose}
            // aria-labelledby="modal-modal-title"
            // aria-describedby="modal-modal-description"
        >
            <Box sx={modalStyle}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
                Enter {modalType} Details
            </Typography>

            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                Complete the form.
            </Typography>

            <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
                {fields.map(f => (
                    <div key={f.name} style={{ marginBottom: "12px" }}>
                        <label style={{ display: "block", marginBottom: 4 }}>
                        {f.label}
                        </label>

                        <input
                        type={f.type || "text"}
                        name={f.name}
                        value={formData[f.name]}
                        onChange={handleChange}
                        style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #ccc",
                            borderRadius: "4px"
                        }}
                        />
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
