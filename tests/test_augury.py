"""Tests for AUGURY (direct runner). AI reveal() validated live on studionet."""
from pathlib import Path

CONTRACT = str(Path(__file__).resolve().parents[1] / "contracts" / "augury.py")
PENDING = 0; FULFILLED = 1; VOID = 2


def _cast(a, vm, who, claim="The Eiffel Tower is in Paris.", url="https://example.com"):
    vm.sender = who
    return a.cast(claim, url)


def test_cast(deploy, direct_vm, direct_alice):
    a = deploy(CONTRACT)
    pid = _cast(a, direct_vm, direct_alice)
    assert pid == 0
    p = a.get_prophecy(0)
    assert p["status"] == PENDING
    assert p["claim"].startswith("The Eiffel")


def test_requires_claim(deploy, direct_vm, direct_alice):
    a = deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("a claim is required"):
        a.cast("  ", "https://x.com")


def test_requires_source(deploy, direct_vm, direct_alice):
    a = deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("a source URL is required"):
        a.cast("Something true.", "")


def test_reveal_requires_pending(deploy, direct_vm, direct_alice):
    a = deploy(CONTRACT)
    _cast(a, direct_vm, direct_alice)
    with direct_vm.expect_revert("no such prophecy"):
        a.reveal(9)


def test_stats(deploy, direct_vm, direct_alice):
    a = deploy(CONTRACT)
    _cast(a, direct_vm, direct_alice, claim="A")
    _cast(a, direct_vm, direct_alice, claim="B")
    s = a.get_stats()
    assert s["total"] == 2
    assert s["pending"] == 2


def test_multiple(deploy, direct_vm, direct_alice):
    a = deploy(CONTRACT)
    _cast(a, direct_vm, direct_alice, claim="One")
    _cast(a, direct_vm, direct_alice, claim="Two")
    assert a.get_prophecy_count() == 2
    assert a.get_prophecy(1)["claim"] == "Two"
