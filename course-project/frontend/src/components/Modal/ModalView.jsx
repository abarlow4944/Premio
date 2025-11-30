import { useState, useEffect } from 'react';
import {
  Box,
  Modal,
} from '@mui/material';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import React from 'react';

function headerFormatter(str) {
  if (str === "id"){
    return "ID"
  }
  else if(str === "utorid"){
    return "UTORid"
  }
  else if(str === "relatedId"){
    return "Reference ID"
  }
  else if(str === "promotionIds"){
    return "Promotion(s)"
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

function bodyFormatter(key, value, obj){
  if (key === "spent"){ // add dollar sign
    if (!value || value === null){
      return "$0"
    }
    else{
      return `$${value}`
    }
  }
  else if(key.includes("related") && value === null){
    return "N/A"
  }
  else if(key === "amount"){
    return `${value} points`
  }

  if (key.toLowerCase().includes("promotionid") && Array.isArray(value)) {
    const promoNames = obj["promotionNames"] || []; // get corresponding names
    if (value.length === 0) return "None Applied";
    return (
      <ul style={{ margin: 0, paddingLeft: "20px" }}>
        {value.map((id, index) => (
          <li key={id}>
            {id}: {promoNames[index] || "Unknown"}
          </li>
        ))}
      </ul>
    );
  }

  // Handle organizers array
  if ((key === "organizers" || key === "guests") && Array.isArray(value)) {
    if (value.length === 0) return "None";
    return (
      <ul style={{ margin: 0, paddingLeft: "20px" }}>
        {value.map((item, index) => (
          <li key={index}>
            {typeof item === 'object' ? (item.name || item.utorid || JSON.stringify(item)) : item}
          </li>
        ))}
      </ul>
    );
  }

  if (value === false){
    return "No"
  }
  else if (value === true){
    return "Yes"
  }

  return value;
}

function formatText(text){
  if (!text){
    return <p className="text-gray-600">No data.</p>
  }

  let obj = text;

  if (typeof text === "string") {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        obj = parsed; 
      } else {
        return <p className="whitespace-pre-wrap text-gray-700">{text}</p>;
      }
    } catch (err) {
      return <p className="whitespace-pre-wrap text-gray-700">{text}</p>;
    }
  }


  if (typeof obj !== "object") {
    return <p className="text-gray-700">{String(obj)}</p>;
  }

  return Object.entries(obj).map(([key, value]) => {
    if (key === "promotionNames") return null; // skip 

    const header = headerFormatter(key);
    const body = bodyFormatter(key, value, obj);
    

    return (
      <div key={key} className="flex flex-col py-3 px-1 border-b border-gray-100 last:border-b-0 hover:bg-red-50 rounded-md transition-colors duration-150 cursor-default">
        <span className="text-sm font-semibold text-strawberry-red-600 mb-1">
          {header}
        </span>
        <span className="text-sm text-gray-600">
          {React.isValidElement(body) ? body : String(body)}
        </span>
        
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

export default function ModalView({ open, onClose, text, title }) {
  const textBody = formatText(text);
    return (
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          {/* Faded background */}
          <div
            className="absolute inset-0 bg-black/40"
            aria-hidden="true"
            onClick={onClose}
          />

          {/* Modal content */}
          <Card className="relative z-10 w-full max-w-lg bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute top-4 right-4 rounded-md p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition duration-150 group/button z-10"
            >
              <XMarkIcon className="size-5 transition-transform duration-150 group-hover/button:rotate-90" />
            </button>
            <CardHeader className="bg-white border-b border-gray-100 py-5 px-6 flex-shrink-0 flex flex-row items-start justify-between">
              <div className="flex-1">
                <CardTitle id="modal-modal-title" className="text-xl font-bold text-strawberry-red-600">
                  {title}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-6 overflow-y-auto flex-1">
              <div className="space-y-0">
                {textBody}
              </div>
            </CardContent>
          </Card>
        </Box>
      </Modal>
    );
}
