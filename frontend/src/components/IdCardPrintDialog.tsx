import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Activity } from 'lucide-react';

interface IdCardPrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
}

export const IdCardPrintDialog: React.FC<IdCardPrintDialogProps> = ({ isOpen, onClose, employee }) => {
  const handlePrint = () => {
    if (!employee) return;

    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);
    const validUntilStr = validUntil.toISOString().split('T')[0];
    const dob = employee.dateOfBirth?.split('T')[0] ?? '';

    // Resolve the photo URL — if it's a relative path, make it absolute
    const photoUrl = employee.photo
      ? (employee.photo.startsWith('http') ? employee.photo : `${window.location.origin}${employee.photo}`)
      : null;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>ID Card - ${employee.name}</title>
  <style>
    @page {
      size: 2.125in 3.375in;
      margin: 0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 2.125in;
      height: 3.375in;
      font-family: system-ui, -apple-system, sans-serif;
      background: white;
      color: black;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .card {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .header {
      background-color: #2563eb;
      color: white;
      text-align: center;
      padding: 8px 4px 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header-title {
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .header-sub {
      font-size: 6px;
      opacity: 0.85;
      letter-spacing: 2px;
      margin-top: 2px;
      text-transform: uppercase;
    }
    .bg-accent {
      position: absolute;
      top: 0; left: 0;
      width: 100%;
      height: 100px;
      background-color: #eff6ff;
    }
    .body {
      flex: 1;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 14px 12px 0;
    }
    .photo-wrap {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background-color: #f3f4f6;
      border: 4px solid white;
      overflow: hidden;
      margin-bottom: 10px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.12);
      position: relative;
      z-index: 1;
    }
    .photo-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .photo-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      color: #9ca3af;
    }
    .emp-name {
      font-size: 13px;
      font-weight: 800;
      text-align: center;
      color: #111827;
      margin-bottom: 2px;
    }
    .emp-title {
      font-size: 8px;
      font-weight: 700;
      color: #2563eb;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
    .divider {
      width: 36px;
      height: 2px;
      background-color: #bfdbfe;
      border-radius: 2px;
      margin-bottom: 10px;
    }
    .details {
      width: 100%;
      margin-top: auto;
      margin-bottom: 10px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 7.5px;
      padding-bottom: 4px;
      border-bottom: 1px solid #f3f4f6;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #9ca3af; font-weight: 500; }
    .detail-value { font-weight: 700; color: #111827; max-width: 95px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .footer {
      background-color: #1f2937;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 8px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .footer-validity { font-size: 6px; color: #d1d5db; font-weight: 500; }
    .footer-badge {
      font-size: 6px;
      color: white;
      background-color: #3b82f6;
      padding: 2px 5px;
      border-radius: 2px;
      font-weight: 700;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="header-title">City Hospital</div>
      <div class="header-sub">Healthcare Excellence</div>
    </div>

    <div class="body">
      <div class="bg-accent"></div>
      <div class="photo-wrap">
        ${photoUrl
          ? `<img src="${photoUrl}" alt="${employee.name}" />`
          : `<div class="photo-placeholder">No Photo</div>`
        }
      </div>
      <div class="emp-name">${employee.name}</div>
      <div class="emp-title">${employee.designation?.name ?? ''}</div>
      <div class="divider"></div>
      <div class="details">
        <div class="detail-row">
          <span class="detail-label">EMP ID</span>
          <span class="detail-value">${employee.code}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">DOB</span>
          <span class="detail-value">${dob}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">DEPT</span>
          <span class="detail-value">${employee.department?.name ?? ''}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <span class="footer-validity">Valid until: ${validUntilStr}</span>
      <span class="footer-badge">STAFF</span>
    </div>
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

        <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-5 text-center">
            A preview of the ID card is shown below. Click "Print ID Card" to open the print dialog with only the card rendered.
          </p>

          {/* Modal Preview — scaled for visibility, purely decorative */}
          <div
            style={{
              width: '2.125in',
              height: '3.375in',
              transform: 'scale(1.25)',
              transformOrigin: 'top center',
              marginBottom: '80px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
              {/* Header */}
              <div style={{ backgroundColor: '#2563eb', color: 'white', textAlign: 'center', padding: '8px 4px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <Activity size={10} color="#bfdbfe" />
                  <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>City Hospital</span>
                </div>
                <div style={{ fontSize: '6px', opacity: 0.8, letterSpacing: '2px', textTransform: 'uppercase' }}>Healthcare Excellence</div>
              </div>

              {/* Body */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 12px 0', position: 'relative', backgroundColor: 'white' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '90px', backgroundColor: '#eff6ff' }} />
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f3f4f6', border: '4px solid white', overflow: 'hidden', marginBottom: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.12)', position: 'relative', zIndex: 1 }}>
                  {employee.photo ? (
                    <img src={employee.photo.startsWith('http') ? employee.photo : `${window.location.origin}${employee.photo}`} alt={employee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#9ca3af' }}>No Photo</div>
                  )}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, textAlign: 'center', color: '#111827', marginBottom: '2px' }}>{employee.name}</div>
                <div style={{ fontSize: '8px', fontWeight: 700, color: '#2563eb', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{employee.designation?.name}</div>
                <div style={{ width: '36px', height: '2px', backgroundColor: '#bfdbfe', borderRadius: '2px', marginBottom: '10px' }} />
                <div style={{ width: '100%', marginTop: 'auto', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {[{ label: 'EMP ID', value: employee.code }, { label: 'DOB', value: employee.dateOfBirth?.split('T')[0] }, { label: 'DEPT', value: employee.department?.name }].map((row) => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', paddingBottom: '4px', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ color: '#9ca3af', fontWeight: 500 }}>{row.label}</span>
                      <span style={{ fontWeight: 700, color: '#111827' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{ backgroundColor: '#1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px' }}>
                <span style={{ fontSize: '6px', color: '#d1d5db', fontWeight: 500 }}>Valid until: {new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]}</span>
                <span style={{ fontSize: '6px', color: 'white', backgroundColor: '#3b82f6', padding: '2px 5px', borderRadius: '2px', fontWeight: 700 }}>STAFF</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Printer className="mr-2 h-4 w-4" /> Print ID Card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
