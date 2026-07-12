import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit, Tag, Package, Building, MapPin, Calendar, 
  DollarSign, Activity, FileText, Image as ImageIcon, AlertCircle, QrCode, Download, Printer
} from 'lucide-react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { localStorageDB } from '../services/localStorageDB';

export default function AssetDetails() {
  const { id } = useParams(); // 'id' corresponds to the tag based on the routing setup
  const [asset, setAsset] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const assets = await localStorageDB.getAll('assets');
        const foundAsset = assets.find(a => a.tag === id);
        
        if (foundAsset) {
          setAsset(foundAsset);
        }
      } catch (error) {
        console.error("Error fetching asset details: ", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAsset();
    
    // Subscribe to activity logs for this asset
    const unsubscribe = localStorageDB.subscribe('activityLogs', (data) => {
      const assetLogs = data
        .filter(log => log.assetTag === id || log.assetId === id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setLogs(assetLogs);
    });

    return () => unsubscribe();
  }, [id]);

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-container").querySelector("svg");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${asset.tag}_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrintQR = () => {
    const svg = document.getElementById("qr-container").innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Print QR - ${asset.tag}</title></head>
        <body style="display:flex; justify-content:center; align-items:center; height:100vh; margin:0;">
          <div style="text-align:center;">
            ${svg}
            <p style="font-family:monospace; margin-top:20px; font-size: 24px;">${asset.tag}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground font-medium">Loading asset details...</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold text-foreground">Asset Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">The asset with tag {id} does not exist.</p>
        <Link to="/admin/assets" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium">
          Return to Directory
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link to="/admin/assets" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border bg-background shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{asset.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                asset.status === 'Available' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' :
                asset.status === 'Allocated' ? 'text-blue-500 bg-blue-500/10 border-blue-500/20' :
                'text-amber-500 bg-amber-500/10 border-amber-500/20'
              }`}>
                {asset.status}
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-sm font-medium flex items-center">
              <Tag className="w-4 h-4 mr-1.5" /> {asset.tag}
            </p>
          </div>
        </div>
        <button className="inline-flex items-center justify-center rounded-lg bg-background border border-border px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors">
          <Edit className="mr-2 h-4 w-4" />
          Edit Details
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-soft p-1.5 flex space-x-1.5">
            <button
              onClick={() => setActiveTab('Overview')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'Overview' 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('Timeline')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'Timeline' 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              Asset Timeline
            </button>
          </div>

          {activeTab === 'Overview' ? (
            <div className="bg-card border border-border rounded-xl shadow-soft">
              <div className="p-5 border-b border-border bg-muted/30">
                <h2 className="text-base font-semibold text-foreground flex items-center">
                  <Package className="w-4 h-4 mr-2 text-primary" />
                  Asset Information
                </h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Category</p>
                <p className="text-sm font-semibold text-foreground flex items-center">
                  {asset.category || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Serial Number</p>
                <p className="text-sm font-semibold text-foreground font-mono">{asset.serialNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Department</p>
                <p className="text-sm font-semibold text-foreground flex items-center">
                  <Building className="w-4 h-4 mr-2 text-muted-foreground" />
                  {asset.department || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Location</p>
                <p className="text-sm font-semibold text-foreground flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                  {asset.location || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Registration Date</p>
                <p className="text-sm font-semibold text-foreground flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                  {asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Condition</p>
                <p className="text-sm font-semibold text-foreground flex items-center">
                  {asset.condition || 'N/A'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Description</p>
                <p className="text-sm text-foreground">{asset.description || 'No description provided.'}</p>
              </div>
            </div>
          </div>
          ) : (
          <div className="bg-card border border-border rounded-xl shadow-soft">
            <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center">
              <h2 className="text-base font-semibold text-foreground flex items-center">
                <Activity className="w-4 h-4 mr-2 text-primary" />
                History & Activity
              </h2>
            </div>
            <div className="p-6">
              <div className="relative border-l-2 border-border ml-3 space-y-8">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground ml-3">No activity history for this asset.</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="relative pl-6">
                      <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1.5 ring-4 ring-card ${
                        log.action.includes('Allocated') ? 'bg-blue-500' : 
                        log.action.includes('Returned') ? 'bg-emerald-500' :
                        log.action.includes('Transferred') ? 'bg-purple-500' :
                        log.action.includes('Maintenance') ? 'bg-amber-500' :
                        log.action.includes('Created') ? 'bg-indigo-500' :
                        'bg-muted-foreground'
                      }`}></div>
                      <div className="bg-muted/20 border border-border rounded-xl p-4 shadow-sm hover:bg-muted/40 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 border-b border-border pb-3">
                          <p className="text-sm font-bold text-foreground">
                            {log.action}
                          </p>
                          <p className="text-[11px] font-semibold text-muted-foreground mt-1 sm:mt-0 bg-muted px-2 py-1 rounded border border-border flex items-center uppercase tracking-wider">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center">
                            <span className="text-xs font-medium text-muted-foreground w-16 uppercase tracking-wider">User:</span>
                            <span className="text-sm font-medium text-foreground">{log.user || 'System'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs font-medium text-muted-foreground w-16 uppercase tracking-wider">Role:</span>
                            <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded uppercase tracking-wider">{log.role || 'System'}</span>
                          </div>
                          {log.notes && (
                            <div className="mt-3 bg-background border border-border p-3 rounded-lg flex items-start">
                              <FileText className="w-4 h-4 text-muted-foreground mr-2 shrink-0 mt-0.5" />
                              <p className="text-sm text-foreground italic">{log.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {asset.status === 'Allocated' && (
            <div className="bg-card border border-border rounded-xl shadow-soft p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Current Assignment</h3>
              <div className="flex items-center p-3 rounded-lg bg-muted/50 border border-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                  {asset.department?.charAt(0) || 'U'}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-semibold text-foreground">Allocated</p>
                  <p className="text-xs text-muted-foreground">{asset.department}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl shadow-soft">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Asset QR Code</h3>
              <QrCode className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="p-6 flex flex-col items-center justify-center bg-white rounded-b-xl space-y-6">
              <div className="flex flex-col items-center">
                <div id="qr-container">
                  <QRCodeSVG 
                    value={asset.qrData || asset.tag || asset.assetId || 'Unknown Asset'} 
                    size={150} 
                    level="H" 
                    includeMargin={true} 
                  />
                </div>
                <p className="text-xs text-zinc-500 font-mono mt-3">QR Code</p>
                <div className="flex space-x-2 mt-4">
                  <button onClick={handleDownloadQR} className="p-2 bg-muted hover:bg-muted/80 rounded-md text-foreground transition-colors" title="Download QR">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={handlePrintQR} className="p-2 bg-muted hover:bg-muted/80 rounded-md text-foreground transition-colors" title="Print QR">
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="w-full h-px bg-border my-2"></div>
              <div className="flex flex-col items-center overflow-hidden w-full">
                <Barcode 
                  value={asset.tag || asset.assetId || 'Unknown'} 
                  width={1.5} 
                  height={50} 
                  fontSize={14} 
                  background="#ffffff" 
                  lineColor="#000000" 
                  margin={10} 
                />
                <p className="text-xs text-zinc-500 font-mono mt-1">Barcode</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-soft">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Documents & Media</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group">
                <FileText className="w-8 h-8 text-primary opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-foreground">Invoice_0123.pdf</p>
                  <p className="text-xs text-muted-foreground">245 KB</p>
                </div>
              </div>
              <div className="flex items-center p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group">
                <ImageIcon className="w-8 h-8 text-indigo-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-foreground">Asset_Photo.jpg</p>
                  <p className="text-xs text-muted-foreground">1.2 MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
