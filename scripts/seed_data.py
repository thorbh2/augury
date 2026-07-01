"""Seed AUGURY with real prophecies on studionet (AI reveal)."""
from pathlib import Path

from gltest_cli.config.general import get_general_config
from gltest_cli.config.user import load_user_config
from gltest import get_contract_factory, get_default_account

ROOT = Path(__file__).resolve().parents[1]
ADDR = "0x83DFaa06EeaaD36e4fEe0E6d3Ac255AC76A91271"
W = "https://en.wikipedia.org/api/rest_v1/page/summary/"

cfg = load_user_config(str(ROOT / "gltest.config.yaml"))
get_general_config().user_config = cfg
factory = get_contract_factory(contract_file_path=str(ROOT / "contracts" / "augury.py"))
c = factory.build_contract(ADDR, account=get_default_account())

PROPHECIES = [
    ("The Eiffel Tower stands in the city of Paris.", W + "Eiffel_Tower", True),
    ("The Great Wall of China is visible from the Moon with the naked eye.", W + "Great_Wall_of_China", True),
    ("Mount Everest is the highest mountain on Earth above sea level.", W + "Mount_Everest", True),
    ("The lost city of Atlantis has been confirmed as a real, discovered place.", W + "Atlantis", True),
    ("Humanity will establish a permanent self-sustaining colony on Mars.", W + "Colonization_of_Mars", False),
]


def main():
    if c.get_prophecy_count().call() == 0:
        for (claim, url, _) in PROPHECIES:
            c.cast(args=[claim, url]).transact()
            print("cast:", claim[:46])

    for pid in range(c.get_prophecy_count().call()):
        do_reveal = PROPHECIES[pid][2] if pid < len(PROPHECIES) else False
        p = c.get_prophecy(args=[pid]).call()
        if do_reveal and int(p["status"]) == 0:
            print("revealing (AI):", p["claim"][:42])
            try:
                c.reveal(args=[pid]).transact()
            except Exception as e:
                print("  reveal ->", e)

    print("stats:", c.get_stats().call())
    for pid in range(c.get_prophecy_count().call()):
        p = c.get_prophecy(args=[pid]).call()
        print(pid, ["PENDING", "FULFILLED", "VOID"][int(p["status"])], "|", p["claim"][:44], "|", (p["rationale"] or "")[:40])


if __name__ == "__main__":
    main()
