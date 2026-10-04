import array,hashlib,math,pathlib,tempfile,unittest,wave
from bounded_landmarks import measure
class ScreenTest(unittest.TestCase):
 def test_measurement_and_nonclaim(self):
  with tempfile.TemporaryDirectory() as d:
   p=pathlib.Path(d)/'fixture.wav'
   with wave.open(str(p),'wb') as w:
    w.setparams((1,2,16000,0,'NONE','not compressed'));w.writeframes(array.array('h',[int(3000*math.sin(2*math.pi*900*t/16000)) for t in range(16000)]).tobytes())
   sha=hashlib.sha256(p.read_bytes()).hexdigest();r=measure(p,.2,.8,sha)
   self.assertFalse(r['accent_verified']);self.assertFalse(r['phoneme_verified'])
   for v in r['measurements']:self.assertTrue(any(abs(f-900)<4 for f in v['spectral_peaks_hz']))
   with self.assertRaises(AssertionError):measure(p,.2,.8,'wrong')
if __name__=='__main__':unittest.main()
