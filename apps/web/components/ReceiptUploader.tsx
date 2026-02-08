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
    const [status, setStatus] = useState<string>(''); // 'ai', 'ocr',Or empty

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setScanning(true);
        setProgress(0);
        setStatus('ai');

        try {
            // 1. Try AI Analysis
            const formData = new FormData();
            formData.append('image', file);

            const res = await fetch('/api/receipt/analyze', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                onScanComplete(data);
                setScanning(false);
                setStatus('');
                return;
            }

            console.warn('AI Analysis failed, falling back to OCR...');
            setStatus('ocr');

            // 2. Fallback to Tesseract OCR
            // Use URL.createObjectURL creates a string URL representing the file object
            // which is safer for workers than the File object directly in some envs.
            const imageUrl = URL.createObjectURL(file);
            
            try {
                const { data: { text } } = await Tesseract.recognize(
                    imageUrl,
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
                // Cleanup
                URL.revokeObjectURL(imageUrl);
                
            } catch (ocrError) {
                console.error('OCR Error:', ocrError);
                throw ocrError;
            }

        } catch (error) {
            console.error('Scanning Error:', error);
            // If AI failed with error (network etc), try OCR if not already tried?
            // The catch block catches both.
            // If status is 'ai', we should try OCR. 
            // Reuse logic? Or just duplicate for safety/simplicity.
            
            if (status === 'ai') {
                 setStatus('ocr');
                 try {
                     const { data: { text } } = await Tesseract.recognize(
                        file,
                        'eng',
                        { logger: m => { if (m.status === 'recognizing text') setProgress(Math.floor(m.progress * 100)); }}
                    );
                    const parsed = parseReceipt(text);
                    onScanComplete(parsed);
                    setScanning(false);
                    setStatus('');
                    return;
                 } catch (ocrErr) {
                     console.error('OCR Fallback Error:', ocrErr);
                     alert('Failed to scan receipt (AI & OCR both failed)');
                 }
            } else {
                 alert('Failed to scan receipt');
            }
        } finally {
            setScanning(false);
            setStatus('');
        }
    };

    return (
        <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-900">Scan Receipt (Optional)</label>
            <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {scanning ? (
                            <div className="text-center w-full px-4">
                                <p className="mb-2 text-sm text-gray-500 font-medium">
                                    {status === 'ai' ? '✨ Analyzing with AI...' : `Scanning locally... ${progress}%`}
                                </p>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div 
                                        className={`h-2.5 rounded-full transition-all duration-300 ${status === 'ai' ? 'bg-indigo-600 w-full animate-pulse' : 'bg-blue-600'}`} 
                                        style={{ width: status === 'ai' ? '100%' : `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <svg className="w-8 h-8 mb-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to scan</span> receipt</p>
                                <p className="text-xs text-gray-400">AI-Powered • Supports IMG, PNG</p>
                            </>
                        )}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={scanning} />
                </label>
            </div>
        </div>
    );
}
