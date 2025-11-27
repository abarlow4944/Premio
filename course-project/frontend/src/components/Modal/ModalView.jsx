import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Modal,
  IconButton,
  Card,
  CardContent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatText(text){
  console.log("TEXT: ", text)

  if (!text){
    console.log("case 1")
    return <Typography>No data.</Typography>
  }

  let obj = text;

  if (typeof text === "string") {
    console.log("case 2");
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        obj = parsed; 
      } else {
        return <Typography sx={{ whiteSpace: "pre-wrap" }}>{text}</Typography>;
      }
    } catch (err) {
      return <Typography sx={{ whiteSpace: "pre-wrap" }}>{text}</Typography>;
    }
  }


  if (typeof obj !== "object") {
    console.log("case 3");
    return <Typography>{String(obj)}</Typography>;
  }

  console.log("case 4");
  return Object.entries(obj).map(([key, value]) => {
    const capKey = key.charAt(0).toUpperCase() + key.slice(1);

    return (
      <div key={key} style={{ marginBottom: "8px" }}>
        <Typography component="span" fontWeight="bold">
          {capKey}:
        </Typography>

        <Typography component="span" sx={{ ml: 1 }}>
          {typeof value === "object" && value !== null
            ? JSON.stringify(value)
            : String(value)}
        </Typography>
      </div>
    );
  });
}

const style = {
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

export default function ModalView({ open, onClose, text }) {
  const textBody = formatText(text);
  return (
    <Modal
      open={open}
      onClose={onClose} // clicking outside also closes
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    ><Card>
        <CardContent>
          <Box sx={style}>
            
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        Details
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                      {textBody}
                    </Box>

                    {/* Close button */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        <Button variant="contained" color="primary" onClick={onClose}>
                            Close
                        </Button>
                    </Box>
            </Box>
        </CardContent>
      </Card>
    </Modal>
  );
}
