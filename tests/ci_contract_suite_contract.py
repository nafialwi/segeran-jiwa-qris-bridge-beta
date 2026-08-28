from pathlib import Path
wf = (Path(__file__).resolve().parents[1] / '.github/workflows/build-apk.yml').read_text()
required = [
    'python3 tests/test_release_identity.py',
    'python3 tests/workflow_release_contract.py',
    'python3 tests/wp9_background_contract.py',
    'python3 tests/wp10_event_contract.py',
]
missing = [x for x in required if x not in wf]
if missing:
    raise AssertionError('workflow does not execute repository contracts: ' + ', '.join(missing))
print('CI_CONTRACT_SUITE_CONTRACT_PASS')
