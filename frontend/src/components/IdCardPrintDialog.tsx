import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface IdCardPrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
}

export const IdCardPrintDialog: React.FC<IdCardPrintDialogProps> = ({ isOpen, onClose, employee }) => {
  const handlePrint = () => {
    if (!employee) return;

    // Resolve the photo URL — if it's a relative path, make it absolute
    const photoUrl = employee.photo
      ? (employee.photo.startsWith('http') ? employee.photo : `${window.location.origin}${employee.photo}`)
      : null;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>ID Card - ${employee.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: 2.125in 3.375in;
      margin: 0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 2.125in;
      height: 3.375in;
      font-family: 'Poppins', sans-serif;
      background: white;
      color: #0D2B45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .card {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      background-color: white;
      overflow: hidden;
    }
    .header {
      margin-top: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .logo-svg {
      width: 36px;
      height: 36px;
      margin-bottom: 4px;
    }
    .brand-title {
      font-size: 14px;
      font-weight: 700;
      color: #0D2B45;
      line-height: 1;
      letter-spacing: 0.5px;
    }
    .brand-subtitle {
      font-size: 5px;
      font-weight: 600;
      color: #4DBE7D;
      letter-spacing: 1.2px;
      margin-top: 2px;
    }
    
    .photo-wrap {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background-color: #E6ECEF;
      margin-top: 24px;
      margin-bottom: 16px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .photo-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .avatar-icon {
      width: 40px;
      height: 40px;
      fill: #B0BEC5;
    }
    
    .emp-name {
      font-size: 12px;
      font-weight: 600;
      color: #0D2B45;
      text-align: center;
      margin-bottom: 2px;
      width: 90%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .emp-designation {
      font-size: 8px;
      font-weight: 500;
      color: #1E8E5A;
      text-align: center;
      margin-bottom: 8px;
      width: 90%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .emp-id {
      font-size: 8px;
      font-weight: 500;
      color: #0D2B45;
      text-align: center;
    }
    
    .footer-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 16px;
      background-color: #1E8E5A;
      border-top: 4px solid #4DBE7D;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <svg class="logo-svg" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="12" height="40" rx="6" fill="#0D2B45"/>
        <rect x="34" y="4" width="12" height="40" rx="6" fill="#0D2B45"/>
        <circle cx="24" cy="14" r="5" fill="#1E8E5A"/>
        <path d="M 23.5 32 C 14 32 14 22 14 22 C 20 20 23.5 25 23.5 32 Z" fill="#4DBE7D"/>
        <path d="M 24.5 32 C 34 32 34 22 34 22 C 28 20 24.5 25 24.5 32 Z" fill="#4DBE7D"/>
      </svg>
      <div class="brand-title">HOSERA</div>
      <div class="brand-subtitle">PEOPLE &bull; SERVICE &bull; CARE</div>
    </div>
    
    <div class="photo-wrap">
      ${photoUrl 
        ? `<img src="${photoUrl}" alt="${employee.name}" />` 
        : `<svg class="avatar-icon" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`
      }
    </div>
    
    <div class="emp-name">${employee.name}</div>
    <div class="emp-designation">${employee.designation?.name || 'Staff Member'}</div>
    <div class="emp-id">${employee.code}</div>
    
    <div class="footer-bar"></div>
  </div>

  <script>
    window.onload = function() {
      window.focus();
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`;

    const printWin = window.open('', '_blank', 'width=300,height=500,toolbar=0,scrollbars=0,status=0');
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Print Employee ID Card</DialogTitle>
        </DialogHeader>

        <style>
          {`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}
        </style>

        <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-5 text-center">
            A preview of the ID card is shown below. Click "Print ID Card" to open the print dialog with only the card rendered.
          </p>

          {/* Modal Preview — scaled for visibility */}
          <div
            style={{
              width: '2.125in',
              height: '3.375in',
              transform: 'scale(1.25)',
              transformOrigin: 'top center',
              marginBottom: '80px',
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E6ECEF', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
              
              {/* Header */}
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <svg style={{ width: '36px', height: '36px', marginBottom: '4px' }} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="4" width="12" height="40" rx="6" fill="#0D2B45"/>
                  <rect x="34" y="4" width="12" height="40" rx="6" fill="#0D2B45"/>
                  <circle cx="24" cy="14" r="5" fill="#1E8E5A"/>
                  <path d="M 23.5 32 C 14 32 14 22 14 22 C 20 20 23.5 25 23.5 32 Z" fill="#4DBE7D"/>
                  <path d="M 24.5 32 C 34 32 34 22 34 22 C 28 20 24.5 25 24.5 32 Z" fill="#4DBE7D"/>
                </svg>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0D2B45', lineHeight: 1, letterSpacing: '0.5px' }}>HOSERA</div>
                <div style={{ fontSize: '5px', fontWeight: 600, color: '#4DBE7D', letterSpacing: '1.2px', marginTop: '2px' }}>PEOPLE &bull; SERVICE &bull; CARE</div>
              </div>

              {/* Photo */}
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#E6ECEF', marginTop: '24px', marginBottom: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {employee.photo ? (
                  <img src={employee.photo.startsWith('http') ? employee.photo : `${window.location.origin}${employee.photo}`} alt={employee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg style={{ width: '40px', height: '40px', fill: '#B0BEC5' }} viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                )}
              </div>

              {/* Info */}
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0D2B45', textAlign: 'center', marginBottom: '2px', width: '90%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{employee.name}</div>
              <div style={{ fontSize: '8px', fontWeight: 500, color: '#1E8E5A', textAlign: 'center', marginBottom: '8px', width: '90%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{employee.designation?.name || 'Staff Member'}</div>
              <div style={{ fontSize: '8px', fontWeight: 500, color: '#0D2B45', textAlign: 'center' }}>{employee.code}</div>

              {/* Footer Bar */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '16px', backgroundColor: '#1E8E5A', borderTop: '4px solid #4DBE7D' }}></div>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handlePrint} className="bg-[#0D2B45] hover:bg-[#0D2B45]/90 text-white">
            <Printer className="mr-2 h-4 w-4" /> Print ID Card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
