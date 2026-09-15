"""Offline structural checks: python tests/check_site.py (requires beautifulsoup4)."""
from pathlib import Path
from urllib.parse import unquote, urlsplit
from bs4 import BeautifulSoup
import json
import re

ROOT = Path(__file__).resolve().parents[1]
PAGES = [ROOT/'index.html', *sorted((ROOT/'projects').glob('*/index.html'))]
raw = (ROOT/'assets/js/translations.js').read_text(encoding='utf-8')
catalog = json.loads(raw.split('window.siteTranslations = ', 1)[1].rstrip().removesuffix(';'))
assert all(set(entry) == {'id', 'en'} and all(entry.values()) for entry in catalog.values())
for page in PAGES:
    soup = BeautifulSoup(page.read_text(encoding='utf-8'), 'html.parser')
    ids = [tag['id'] for tag in soup.select('[id]')]
    assert len(ids) == len(set(ids)), f'Duplicate IDs in {page}'
    assert len(soup.select('main')) == 1
    assert len(soup.select('h1')) == 1
    assert len(soup.select('[data-language]')) == 2
    assert not soup.select('a a'), f'Nested links in {page}'
    assert not soup.select('[data-i18n] [data-i18n]'), f'Nested translation targets in {page}'
    for element in soup.find_all(True):
        for attr, value in element.attrs.items():
            if attr.startswith('data-i18n'):
                assert value in catalog, f'Missing translation: {value}'
        for attr in ('src', 'href'):
            if not element.has_attr(attr): continue
            url = urlsplit(element[attr])
            if url.scheme or url.netloc: continue
            target = (page.parent/unquote(url.path)).resolve() if url.path else page
            if target.is_dir(): target /= 'index.html'
            assert target.is_file(), f'Broken {attr}: {element[attr]} in {page}'
            if url.fragment and target.suffix == '.html':
                other = BeautifulSoup(target.read_text(encoding='utf-8'), 'html.parser')
                assert other.find(id=url.fragment), f'Missing anchor: {element[attr]}'
    for image in soup.select('img[src]'):
        assert image.get('alt'), f'Missing image description in {page}'
        assert image.has_attr('width') and image.has_attr('height')
        for candidate in image.get('srcset', '').split(','):
            if not candidate.strip(): continue
            url, width = candidate.strip().rsplit(' ', 1)
            assert (page.parent/unquote(url)).is_file()
            assert re.fullmatch(r'\d+w', width)
    scripts = [Path(tag['src']).name for tag in soup.select('script[src]')]
    assert scripts.index('translations.js') < scripts.index('i18n.js') < scripts.index('gallery.js')
    print(f'PASS {page.relative_to(ROOT)}: links, anchors, images, controls, translations')

home = BeautifulSoup((ROOT/'index.html').read_text(encoding='utf-8'), 'html.parser')
assert [tag['id'] for tag in home.select('main > section')][:2] == ['home', 'projects']
assert 'Hexaka' in home.select_one('.project__name').get_text()
assert len(home.select('#experience > .container > .log > .log__item')) == 4
assert len(home.select('.experience-history .log__item')) == 6
print(f'PASS {len(catalog)} bilingual entries; featured project and experience order')
