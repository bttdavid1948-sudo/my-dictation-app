import tempfile,pathlib,wave,array,math,hashlib,unittest
from compose import compose
class MixTest(unittest.TestCase):
 def test_mapping_and_overlap(self):
  with tempfile.TemporaryDirectory() as d:
   root=pathlib.Path(d);rows=[]
   for i in range(6):
    a=array.array('h',[int(4000*math.sin(2*math.pi*(180+i*30)*t/24000)) if 2400<t<45600 else 0 for t in range(48000)])
    p=root/f'{i}.wav'
    with wave.open(str(p),'wb') as w:w.setparams((1,2,24000,0,'NONE','not compressed'));w.writeframes(a.tobytes())
    rows.append({'segment_id':f'S00{i+1}','text':f'unchanged {i}','file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
   m={'lessons':[{'segments':rows}]};r=compose(m,root,root/'out')
   self.assertEqual(len(r['overlap_events']),3)
   self.assertEqual([s['segment_id'] for s in r['segments']],[s['segment_id'] for s in rows])
   for e in r['overlap_events']:self.assertGreater(e['simultaneous_above_threshold_seconds'],.1)
   self.assertEqual(r['sha256'],compose(m,root,root/'out')['sha256'])
   rows[1]['sha256']='bad'
   with self.assertRaises(AssertionError):compose(m,root,root/'out')
if __name__=='__main__':unittest.main()
