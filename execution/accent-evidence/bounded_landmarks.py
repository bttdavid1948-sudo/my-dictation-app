"""Internal measurement only. Never converts spectral differences into accent PASS."""
import hashlib,json,pathlib,wave
import numpy as np
from scipy.signal import find_peaks

def measure(path,start,end,expected_sha256):
 p=pathlib.Path(path);actual=hashlib.sha256(p.read_bytes()).hexdigest();assert actual==expected_sha256
 with wave.open(str(p)) as w:
  assert w.getsampwidth()==2 and w.getnchannels()==1
  sr=w.getframerate();x=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(float)/32768
 assert 0<=start<end<=len(x)/sr and end-start>=.05
 estimates=[]
 for shift in [-.02,0,.02]:
  lo=max(0,round((start+shift)*sr));hi=min(len(x),round((end+shift)*sr));y=x[lo:hi]
  spectrum=abs(np.fft.rfft(y*np.hanning(len(y))))**2;freq=np.fft.rfftfreq(len(y),1/sr)
  peaks,_=find_peaks(spectrum);peaks=[i for i in peaks if 300<freq[i]<4000]
  peaks=sorted(peaks,key=lambda i:spectrum[i],reverse=True)[:5]
  estimates.append({'shift_seconds':shift,'rms_dbfs':float(20*np.log10(max(1e-12,np.sqrt(np.mean(y*y))))),'spectral_peaks_hz':sorted(float(freq[i]) for i in peaks)})
 return {'asset_sha256':actual,'window':[start,end],'window_identity':'EXTERNALLY_SUPPLIED_UNVERIFIED','measurements':estimates,'accent_verified':False,'phoneme_verified':False,'limitation':'FFT peaks are not validated formants or accent labels; requires independently grounded phonetic windows and calibrated contrast references.','method':'BOUNDED_SPECTRAL_SCREEN_v0.1'}

if __name__=='__main__':
 import sys
 print(json.dumps(measure(sys.argv[1],float(sys.argv[2]),float(sys.argv[3]),sys.argv[4]),indent=2))
