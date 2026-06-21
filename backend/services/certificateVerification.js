const Jimp = require('jimp');
const QrCode = require('qrcode-reader');
const axios = require('axios');

class CertificateVerificationService {
  // Platform patterns for verification
  static patterns = {
    coursera: {
      urlPattern: /coursera\.org\/verify\/([A-Z0-9-]+)/i,
      name: 'Coursera'
    },
    nptel: {
      urlPattern: /nptel\.ac\.in.*?[/?&]([A-Z0-9]+)/i,
      name: 'NPTEL'
    },
    udemy: {
      urlPattern: /ude\.my\/([A-Z0-9_-]+)|udemy\.com\/certificate/i,
      name: 'Udemy'
    },
    linkedin: {
      urlPattern: /linkedin\.com\/learning\/certificates\/([a-f0-9]+)/i,
      name: 'LinkedIn Learning'
    },
    google: {
      urlPattern: /credential\.net|grow\.google/i,
      name: 'Google'
    },
    microsoft: {
      urlPattern: /microsoft\.com.*credential|aka\.ms\/certrecord/i,
      name: 'Microsoft'
    }
  };

  // Read QR code from local file
  static async readQRCode(filePath) {
    try {
      const image = await Jimp.read(filePath);
      const qr = new QrCode();
      
      return new Promise((resolve) => {
        qr.callback = (err, value) => {
          if (err) {
            console.error('QR Code error:', err);
            resolve(null);
          } else {
            resolve(value ? value.result : null);
          }
        };
        qr.decode(image.bitmap);
      });
    } catch (error) {
      console.error('Error reading QR:', error);
      return null;
    }
  }

  // Detect platform from URL
  static detectPlatform(url) {
    if (!url) return null;

    for (const [platform, config] of Object.entries(this.patterns)) {
      if (url.match(config.urlPattern)) {
        return {
          platform: platform,
          name: config.name,
          verified: true
        };
      }
    }
    return null;
  }

  // Check if URL is accessible
  static async checkUrlAccessibility(url) {
    try {
      const response = await axios.head(url, { 
        timeout: 5000,
        maxRedirects: 5 
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Main verification method
  static async verifyCertificate(filePath, providedUrl) {
    const result = {
      hasQRCode: false,
      qrData: null,
      platform: null,
      isVerified: false,
      verificationMethod: null
    };

    try {
      // Try to read QR code
      if (filePath && fs.existsSync(filePath)) {
        const qrData = await this.readQRCode(filePath);
        if (qrData) {
          result.hasQRCode = true;
          result.qrData = qrData;

          // Check if QR contains a verification URL
          if (qrData.startsWith('http')) {
            const platformInfo = this.detectPlatform(qrData);
            if (platformInfo) {
              result.platform = platformInfo.name;
              result.isVerified = true;
              result.verificationMethod = 'QR Code';
              
              // Check if URL is accessible
              const isAccessible = await this.checkUrlAccessibility(qrData);
              result.urlAccessible = isAccessible;
            }
          }
        }
      }

      // If no QR verification, check provided URL
      if (!result.isVerified && providedUrl) {
        const platformInfo = this.detectPlatform(providedUrl);
        if (platformInfo) {
          result.platform = platformInfo.name;
          result.isVerified = true;
          result.verificationMethod = 'URL';
          
          // Check if URL is accessible
          const isAccessible = await this.checkUrlAccessibility(providedUrl);
          result.urlAccessible = isAccessible;
        }
      }

      return result;
    } catch (error) {
      console.error('Verification error:', error);
      return result;
    }
  }
}

module.exports = CertificateVerificationService;
