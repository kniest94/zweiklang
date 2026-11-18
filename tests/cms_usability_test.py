"""CMS-Bedienvertrag; benötigt lokal PyYAML. Kein Ersatz für einen echten Handytest."""
from pathlib import Path
from copy import deepcopy
import json, unittest
import yaml
ROOT=Path(__file__).resolve().parents[1]
def flatten(entries):
    return [leaf for e in entries for leaf in (flatten(e['items']) if e['type']=='group' else [e])]
def subset(fields,data):
    return {f['name']: subset(f['fields'],data[f['name']]) if f['type']=='object' else deepcopy(data[f['name']]) for f in fields if f['name'] in data}
def deep_merge(base,patch):
    result=deepcopy(base)
    for k,v in patch.items():
        result[k]=deep_merge(result.get(k,{}),v) if isinstance(v,dict) else deepcopy(v)
    return result
class CmsUsabilityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config=yaml.safe_load((ROOT/'.pages.yml').read_text());cls.entries=flatten(cls.config['content']);cls.by_name={e['name']:e for e in cls.entries}
    def test_frequent_tasks_and_advanced_settings_are_separate(self):
        self.assertEqual([e['name'] for e in self.config['content']],['termine','galerie','videos','repertoire','steckbriefe','hoerproben','seitentexte','erweitert'])
        self.assertEqual([e['name'] for e in self.config['content'][-1]['items']],['seitenbeschriftungen','terminbild','kontakt','videogruppen','impressum','datenschutz'])
        self.assertEqual(len(self.by_name),len(self.entries))
    def test_video_choices_use_human_labels_and_existing_ids(self):
        e=self.by_name['videos'];f=next(x for x in e['fields'] if x['name']=='gruppe')
        self.assertEqual(f['type'],'select')
        groups=json.loads((ROOT/'content/videogruppen.json').read_text())
        self.assertEqual(f['options']['values'],[{'name':g['id'],'label':g['name']} for g in groups])
        typ=next(x for x in e['fields'] if x['name']=='typ')
        self.assertEqual([v['name'] for v in typ['options']['values']],['mp4','instagram'])
    def test_gallery_requires_only_photo_and_description(self):
        fields=self.by_name['galerie']['fields']
        self.assertEqual([f['name'] for f in fields],['gross','alt','klein'])
        self.assertIs(fields[-1]['readonly'],True)
        self.assertFalse(fields[-1].get('required',False))
    def test_separate_page_editors_preserve_all_unedited_nested_keys(self):
        self.assertIs(self.config['settings']['content']['merge'],True)
        data=json.loads((ROOT/'content/seite.json').read_text());seen={}
        page_entries=[e for e in self.entries if e['path']=='content/seite.json']
        self.assertEqual(len(page_entries),5)
        for e in page_entries:
            self.assertFalse(e.get('list',False),'Merge is only supported for non-list files')
            patch=subset(e['fields'],data)
            self.assertEqual(deep_merge(data,patch),data,'Unchanged form must preserve all data')
            if patch.get('texte'):
                key=next(iter(patch['texte']));patch['texte'][key]='Nur dieser Text ist geändert'
                merged=deep_merge(data,patch)
                self.assertEqual(merged['texte'][key],'Nur dieser Text ist geändert')
                for other,value in data['texte'].items():
                    if other!=key:self.assertEqual(merged['texte'][other],value)
            for f in e['fields']:
                if f['name']=='texte':
                    for child in f['fields']:
                        self.assertNotIn(child['name'],seen);seen[child['name']]=True
        self.assertEqual(set(seen),set(data['texte']))
    def test_every_original_content_source_remains_available(self):
        self.assertEqual({e['path'] for e in self.entries},{f'content/{n}.json' for n in ['termine','repertoire','galerie','videos','videogruppen','steckbriefe','hoerproben','kontakt','seite']}|{'impressum.html','datenschutz.html'})
if __name__=='__main__':unittest.main(verbosity=2)
