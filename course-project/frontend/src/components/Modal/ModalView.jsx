import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Modal,
  Card,
  CardContent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Button } from "@/components/UI/button";

function headerFormatter(str) {
  if (str === "id"){
    return "ID"
  }
  else if(str === "utorid"){
    return "UTORid"
  }
  else if(/.[A-Z]/.test(str)){
    let separateHeader = str.split(/(?=[A-Z])/);
    separateHeader = separateHeader.map(i =>
      i === "Ids" ? "ID(s)" : i
    );

    str = separateHeader.join(" ");
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function bodyFormatter(key, value){
  if (key === "spent"){ // add dollar sign
    
  }
}

function formatText(text){
  console.log("TEXT: ", text)

  if (!text){
    return <Typography>No data.</Typography>
  }

  let obj = text;

  if (typeof text === "string") {
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
    return <Typography>{String(obj)}</Typography>;
  }

  return Object.entries(obj).map(([key, value]) => {
    const header = headerFormatter(key);
    const body = bodyFormatter(key, value);

    return (
      <div key={key} style={{ marginBottom: "8px" }}>
        <Typography component="span" fontWeight="bold">
          {header}:
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
  width: 420,
  outline: 'none',
};

export default function ModalView({ open, onClose, text }) {
  const textBody = formatText(text);
  return (
    <Modal
      open={open}
      onClose={onClose} // clicking outside also closes
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
        <Box sx={style}>
          <Card sx={{ borderRadius: 3, boxShadow: 6 }}>
              <CardContent sx={{ p: 3, position: "relative" }}>
                <Typography id="modal-modal-title" variant="h6" component="h2">
                    Details
                </Typography>

                <Box sx={{ mt: 2 }}>
                  {textBody}
                </Box>

                {/* Close button */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    <Button variant="default" onClick={onClose}>
                        Close
                    </Button>
                </Box>
              </CardContent>
            </Card>
        </Box>
    </Modal>
  );
}
