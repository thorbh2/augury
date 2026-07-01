# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""
AUGURY - Prophecies Judged by Consensus
=======================================
A prophecy is a verifiable claim plus a public source. Anyone can cast one. To
reveal it, the contract reads the source and a validator set decides, under the
Equivalence Principle, whether the claim is TRUE according to the evidence.
Fulfilled prophecies burn bright; voided ones fade. The verdict is permanent.

Status: PENDING(0) -> FULFILLED(1, true) | VOID(2, false)
"""

from genlayer import *
from dataclasses import dataclass
import json
import typing


PENDING = 0
FULFILLED = 1
VOID = 2


@allow_storage
@dataclass
class Prophecy:
    seer: Address
    claim: str
    source_url: str
    status: u8
    rationale: str


class Augury(gl.Contract):
    prophecies: DynArray[Prophecy]

    def __init__(self) -> None:
        pass

    @gl.public.write
    def cast(self, claim: str, source_url: str) -> int:
        if len(claim.strip()) == 0:
            raise gl.vm.UserError("a claim is required")
        if len(source_url.strip()) == 0:
            raise gl.vm.UserError("a source URL is required")
        p = self.prophecies.append_new_get()
        p.seer = gl.message.sender_address
        p.claim = claim
        p.source_url = source_url
        p.status = u8(PENDING)
        p.rationale = ""
        return len(self.prophecies) - 1

    @gl.public.write
    def reveal(self, prophecy_id: int) -> None:
        """Read the source; validators decide whether the claim is true."""
        p = self._get(prophecy_id)
        if p.status != PENDING:
            raise gl.vm.UserError("this prophecy is already revealed")

        claim = p.claim
        url = p.source_url

        def leader_fn() -> str:
            page = ""
            try:
                page = gl.nondet.web.get(url).body.decode("utf-8")[:6000]
            except Exception:
                page = "(source unreachable)"
            prompt = (
                f"A prophecy makes a factual claim.\nCLAIM: {claim}\n\n"
                f"Source document:\n{page}\n\n"
                "Based strictly on the source, is the claim TRUE? Reply with ONLY "
                'JSON: {"verdict": "true"} if the source supports the claim, '
                '{"verdict": "false"} if the source contradicts it or does not '
                'support it, plus a short "reason".'
            )
            return gl.nondet.exec_prompt(prompt)

        def validator_fn(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            return self._decision_of(leader_res.calldata)[0] == self._decision_of(leader_fn())[0]

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        truth, reason = self._decision_of(result)
        p.rationale = reason[:300]
        p.status = u8(FULFILLED) if truth else u8(VOID)

    # ------------------------------------------------------------------ views
    @gl.public.view
    def get_prophecy_count(self) -> int:
        return len(self.prophecies)

    @gl.public.view
    def get_stats(self) -> dict:
        f = 0
        v = 0
        pend = 0
        for p in self.prophecies:
            if p.status == FULFILLED:
                f += 1
            elif p.status == VOID:
                v += 1
            else:
                pend += 1
        return {"total": len(self.prophecies), "fulfilled": f, "void": v, "pending": pend}

    @gl.public.view
    def get_prophecy(self, prophecy_id: int) -> dict:
        p = self._get(prophecy_id)
        return {
            "seer": p.seer.as_hex,
            "claim": p.claim,
            "source_url": p.source_url,
            "status": int(p.status),
            "rationale": p.rationale,
        }

    # -------------------------------------------------------------- internals
    def _get(self, prophecy_id: int) -> Prophecy:
        if prophecy_id < 0 or prophecy_id >= len(self.prophecies):
            raise gl.vm.UserError("no such prophecy")
        return self.prophecies[prophecy_id]

    def _decision_of(self, result: typing.Any) -> tuple:
        data = result
        if isinstance(data, str):
            data = self._extract_json(data)
        if not isinstance(data, dict):
            return (False, "")
        raw = data.get("verdict", None)
        reason = str(data.get("reason", ""))
        if isinstance(raw, bool):
            return (raw, reason)
        if isinstance(raw, str):
            return (raw.strip().lower() == "true", reason)
        return (False, reason)

    def _extract_json(self, text: str) -> typing.Any:
        try:
            return json.loads(text)
        except (ValueError, TypeError):
            pass
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start:end + 1])
            except (ValueError, TypeError):
                return None
        return None
