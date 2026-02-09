import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, X, Download } from 'lucide-react';
import { Credential } from '../types';
import { Modal } from './Modal';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (creds: Credential[]) => Promise<void>;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedCreds, setParsedCreds] = useState<Credential[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const lines = text.split(/\r?\n/);
        const creds: Credential[] = [];
        
        let startIndex = 0;
        // Basic check to skip header if it looks like one
        if (lines[0] && lines[0].toLowerCase().includes('tool')) startIndex = 1;

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Simple comma split. Note: Does not handle commas within quoted fields.
            const parts = line.split(',');
            if (parts.length < 3) continue; 

            const [tool, link, username, password, ldapStr, ...descParts] = parts;
            
            if (!tool || !username) continue; 

            creds.push({
                tool: tool.trim(),
                link: link?.trim() || '',
                username: username.trim(),
                password: password?.trim() || '',
                ldap: ldapStr?.trim().toLowerCase() === 'true' || ldapStr?.trim() === '1',
                description: descParts.join(',').trim()
            });
        }
        
        if (creds.length === 0) {
            setError("No valid credentials found in CSV. Please ensure format: tool,link,username,password,ldap,description");
            setParsedCreds([]);
        } else {
            setParsedCreds(creds);
            setError(null);
        }
      } catch (err) {
        setError("Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsedCreds.length === 0) return;
    setLoading(true);
    try {
        await onImport(parsedCreds);
        handleClose();
    } catch (e) {
        setError("Import failed. Please try again.");
        setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedCreds([]);
    setError(null);
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Credentials">
        <div className="space-y-4">
            <div className="text-sm text-gray-500 space-y-2">
                <p>Upload a CSV file to bulk import credentials.</p>
                <div className="bg-gray-50 p-3 rounded border border-gray-100 font-mono text-xs overflow-x-auto">
                    tool,link,username,password,ldap,description<br/>
                    Slack,https://slack.com,user@email.com,pass123,true,Main comms
                </div>
            </div>

            {!file ? (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors group"
                >
                    <Upload className="w-10 h-10 text-gray-400 mb-2 group-hover:text-primary-500 transition-colors" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-primary-700">Click to upload CSV</span>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".csv" 
                        onChange={handleFileChange}
                    />
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center">
                        <FileText className="w-8 h-8 text-primary-600 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{file.name}</p>
                            <p className="text-xs text-green-600 font-medium">
                                {parsedCreds.length} credentials ready
                            </p>
                        </div>
                    </div>
                    <button onClick={() => { setFile(null); setParsedCreds([]); setError(null); }} className="text-gray-400 hover:text-red-500 p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <div className="flex justify-end pt-4 gap-3">
                <button onClick={handleClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">Cancel</button>
                <button 
                    onClick={handleImport} 
                    disabled={parsedCreds.length === 0 || loading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm font-medium shadow-sm transition-colors"
                >
                    {loading ? (
                        <>Processing...</>
                    ) : (
                        <>
                            <Download className="w-4 h-4 mr-2" />
                            Import {parsedCreds.length > 0 ? `(${parsedCreds.length})` : ''}
                        </>
                    )}
                </button>
            </div>
        </div>
    </Modal>
  )
}