import React, { useState } from 'react';

const DownloadReportButton = ({ branchId = null }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Direct the request to the branch-specific or overall endpoint
      const url = branchId 
        ? `/api/reports/export?branchId=${branchId}`
        : '/api/reports/export';
        
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          // Add your authorization tokens if your API requires them
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      // Convert the response to a Blob to force a file download in the browser
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Set the dynamic filename based on dashboard type
      link.setAttribute('download', branchId ? `Branch_${branchId}_Report.xlsx` : 'Overall_System_Report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading the report:', error);
      alert('Could not download the report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button 
      className="btn btn-primary btn-sm" 
      onClick={handleDownload} 
      disabled={downloading}
    >
      {downloading ? 'Downloading...' : '📥 Download Excel Report'}
    </button>
  );
};

export default DownloadReportButton;