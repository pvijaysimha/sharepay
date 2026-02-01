'use client';

import { useState } from 'react';
import Tesseract from 'tesseract.js';
import { parseReceipt, ParsedReceipt } from '../lib/receipt-parser';

interface ReceiptUploaderProps {
    onScanComplete: (data: ParsedReceipt) => void;
}

export default function ReceiptUploader({ onScanComplete }: ReceiptUploaderProps) {
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setScanning(true);
        setProgress(0);

        try {
            const { data: { text } } = await Tesseract.recognize(
                file,
                'eng',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setProgress(Math.floor(m.progress * 100));
                        }
                    }
                }
            );
            
            const parsed = parseReceipt(text);
            onScanComplete(parsed);
        } catch (error) {
            console.error('OCR Error:', error);
            alert('Failed to scan receipt');
        } finally {
            setScanning(false);
        }
    };

    return (
        <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-900">Scan Receipt (Optional)</label>
            <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {scanning ? (
                            <div className="text-center">
                                <p className="mb-2 text-sm text-gray-500">Scanning... {progress}%</p>
                                <div className="w-48 bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                </svg>
                                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF</p>
                            </>
                        )}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={scanning} />
                </label>
            </div>
        </div>
    );
}
