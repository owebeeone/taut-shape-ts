"""Explicit development-only re-vendoring from canonical base Taut; no installs."""
from pathlib import Path
import argparse
import hashlib
import json
import sys

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--taut',type=Path,default=Path(__file__).resolve().parents[2]/'taut')
args=parser.parse_args()
source=args.taut/'src/taut/gen/runtime/typescript'
destination=Path(__file__).resolve().parents[1]/'foundation-src'
names=('cbor','codec','schema','jsoncodec','ext','snapshots','descriptors','reports','foundation','validation')
destination.mkdir(exist_ok=True)
sources={}
for name in names:
    data=(source/(name+'.ts')).read_bytes()
    (destination/(name+'.ts')).write_bytes(data)
    sources[name+'.ts']=hashlib.sha256(data).hexdigest()
(destination/'provenance.json').write_text(json.dumps(dict(owner='taut.typescript.foundation',build='typescript-oneof-reference.1',
    source='taut/src/taut/gen/runtime/typescript',sources=sources),indent=2,sort_keys=True)+'\n',newline='\n')
# Metadata migration is explicit development generation, never an application loader.
sys.path.insert(0,str(args.taut/'src'))
from taut.ir.load import schema_from_json
from taut.gen.typescript_metadata import emit_types
for path in sorted((destination.parent/'src/taut/gen').glob('*.ir.json')):
    schema=schema_from_json(json.loads(path.read_text()))
    path.with_suffix('').with_suffix('.ts').write_text(emit_types(schema,
        runtime_module='../../../foundation/cjs/foundation.js',validation_module='../../../foundation/cjs/validation.js',
        identity=path.name.removesuffix('.ir.json')),encoding='utf-8',newline='\n')
