import streamlit as st
import pandas as pd
from datetime import datetime
from uuid import uuid4
from urllib.parse import urlencode, urlunparse
import random
from streamlit.runtime.scriptrunner import script_run_context

# ---------- CONFIG ----------
st.set_page_config(
    page_title="Red Line – Anti-Corruption Simulator",
    page_icon="🟥",
    layout="centered",
)

PRIMARY = "#0ea5e9"  # sky-500
ACCENT = "#14b8a6"   # teal-500
DANGER = "#ef4444"   # red-500
MUTED = "#64748b"    # slate-500

APP_NAME = "Red Line – Anti-Corruption Simulator"
FEEDBACK_URL = "https://forms.gle/replace-with-your-form"


def build_share_url() -> str:
    """Return a shareable URL with default UTM parameters."""

    ctx = script_run_context.get_script_run_ctx()
    scheme = "http"
    netloc = None
    path = "/"

    if ctx is not None:
        headers = getattr(ctx, "request_headers", {}) or {}
        forwarded_proto = headers.get("X-Forwarded-Proto", "")
        if forwarded_proto:
            scheme = forwarded_proto.split(",")[0]
        host = headers.get("Host")
        if host:
            netloc = host
        forwarded_path = headers.get("X-Forwarded-Path", "")
        if forwarded_path:
            path = forwarded_path

    if netloc is None:
        address = st.get_option("browser.serverAddress")
        port = st.get_option("browser.serverPort")
        if str(port) == "443":
            scheme = "https"
        if port and str(port) not in ("80", "443"):
            netloc = f"{address}:{port}"
        else:
            netloc = address

    if not path:
        path = "/"
    if not path.startswith("/"):
        path = f"/{path}"

    query = urlencode({"utm_source": "linkedin", "utm_campaign": "mvp_post"})
    return urlunparse((scheme, netloc, path, "", query, ""))

# ---------- DILEMMAS ----------
DILEMMAS = [
    {
        "id": "bribe_supervisor_email",
        "title": "Your supervisor suggests a ‘facilitation payment’.",
        "context": (
            "You're a procurement officer. A supplier hints a contract will be expedited if you approve a small "
            "'facilitation payment'. Your supervisor forwards the request and writes: "
            "'This is how things get done—don’t overthink it.'"
        ),
        "choices": [
            {"key": "A", "label": "Refuse, document, and report via the official channel.", "score": 3,
             "feedback": "Strong: avoids participation, creates audit trail, and escalates via protected channel."},
            {"key": "B", "label": "Comply quietly—it's a small amount and the project matters.", "score": 0,
             "feedback": "High risk: even small 'facilitation' payments can be illegal and set precedent."},
            {"key": "C", "label": "Ask Legal/Compliance in writing if this qualifies as facilitation.", "score": 2,
             "feedback": "Good instinct; seek formal guidance and halt until documented advice is received."},
            {"key": "D", "label": "Tell supplier any extra fees must be invoiced transparently.", "score": 1,
             "feedback": "Transparency helps, but does not address the bribery attempt. Escalation needed."},
        ],
        "resources": [
            {"name": "Transparency International – Facilitation Payments", "url": "https://www.transparency.org/en/our-priorities/business-integrity/facilitation-payments"},
            {"name": "OECD Anti-Bribery Convention (overview)", "url": "https://www.oecd.org/corruption/oecdantibriberyconvention.htm"},
        ],
    },
    {
        "id": "gift_vendor_conference",
        "title": "A vendor offers you a VIP conference pass + hotel upgrade.",
        "context": (
            "You manage an RFP expected to launch next month. A current vendor (likely to bid) offers a free VIP pass, "
            "hotel upgrade, and private dinner with their execs at an industry conference this week."
        ),
        "choices": [
            {"key": "A", "label": "Decline and disclose the offer to Compliance immediately.", "score": 3,
             "feedback": "Correct: avoids conflict and creates a record before the RFP opens."},
            {"key": "B", "label": "Accept the pass but pay your own hotel and skip the dinner.", "score": 1,
             "feedback": "Partial mitigation, but still creates perceived influence; risky before an RFP."},
            {"key": "C", "label": "Ask to postpone any benefit until after contract award.", "score": 1,
             "feedback": "Defers but does not solve COI; optics remain problematic."},
            {"key": "D", "label": "Accept everything and promise no preferential treatment.", "score": 0,
             "feedback": "Direct COI and appearance of bias; undermines RFP integrity."},
        ],
        "resources": [
            {"name": "COI Guidelines (generic)", "url": "https://www.oecd.org/gov/ethics/48649107.pdf"}
        ],
    },
    {
        "id": "bid_splitting_threshold",
        "title": "Your team suggests splitting a purchase to avoid a tender.",
        "context": (
            "Urgent: you need equipment worth slightly above the competitive tender threshold. A colleague proposes "
            "splitting it into two invoices across months to 'save time'."
        ),
        "choices": [
            {"key": "A", "label": "Refuse, document the pressure, and initiate the proper tender.", "score": 3,
             "feedback": "Correct: bid-splitting to avoid thresholds is a classic red flag; follow due process."},
            {"key": "B", "label": "Agree if you obtain three quotes for each smaller purchase.", "score": 1,
             "feedback": "Three quotes don't cure threshold evasion; intent matters."},
            {"key": "C", "label": "Seek written waiver/justification from the approving authority.", "score": 2,
             "feedback": "Better: formal waiver may be permissible under narrow policy exceptions; ensure audit trail."},
            {"key": "D", "label": "Use a friendly supplier who will post-date invoices.", "score": 0,
             "feedback": "Falsification and collusion risks; severe misconduct."},
        ],
        "resources": [
            {"name": "World Bank – Red Flags in Procurement", "url": "https://documents.worldbank.org"}
        ],
    },
    {
        "id": "whistleblower_retaliation",
        "title": "A manager hints your contract won't be renewed if you report.",
        "context": (
            "You witnessed irregular approvals. HR warns that 'making noise' could affect your upcoming contract renewal. "
            "You're on a temporary contract."
        ),
        "choices": [
            {"key": "A", "label": "Report via the protected whistleblowing channel; request confidentiality.", "score": 3,
             "feedback": "Correct: activates protection measures; creates a time-stamped report outside local hierarchy."},
            {"key": "B", "label": "Confront the manager privately and ask them to fix it quietly.", "score": 1,
             "feedback": "May escalate risk to you; lacks protection or independent record."},
            {"key": "C", "label": "Wait until your renewal is signed, then report.", "score": 1,
             "feedback": "Delays allow further harm and could implicate you as complicit."},
            {"key": "D", "label": "Do nothing; protect your job.", "score": 0,
             "feedback": "No action enables misconduct and erodes protection frameworks."},
        ],
        "resources": [
            {"name": "EU Whistleblower Protection (overview)", "url": "https://commission.europa.eu/policies/justice-and-fundamental-rights/whistleblower-protection_en"}
        ],
    },
    {
        "id": "collective_action_or_collusion",
        "title": "Competitors propose a 'clean business' pact—plus a pricing clause.",
        "context": (
            "Ahead of a big donor-funded RFP, several major suppliers invite you (as the buyer) to endorse a "
            "'Collective Action Charter' to refuse facilitation payments and share red flags. Hidden in the draft is a clause "
            "that signatories will 'not undercut below a sustainable floor price'."
        ),
        "choices": [
            {"key": "A", "label": "Support the anti-bribery charter but demand removal of any pricing/market-allocation language; involve Competition/Legal.", "score": 3,
             "feedback": "Best balance: collective action on integrity is positive, but price floors risk anti-competitive collusion. Keep integrity collaboration, remove market/pricing coordination."},
            {"key": "B", "label": "Reject the charter entirely—too risky.", "score": 1,
             "feedback": "Overly cautious: you lose a chance to improve integrity. Safer to fix the clause than walk away."},
            {"key": "C", "label": "Approve as-is—it helps fight corruption and simplifies evaluation.", "score": 0,
             "feedback": "High antitrust risk: price floors/market allocation can be illegal even with good intent."},
            {"key": "D", "label": "Stay neutral and let suppliers sign among themselves; keep it off the record.", "score": 1,
             "feedback": "Avoids direct buyer involvement but ignores antitrust red flags that could taint the tender."},
        ],
        "resources": [
            {"name": "OECD – Collective Action in Anti-Corruption (but mind competition law)", "url": "https://www.oecd.org/corruption/"},
            {"name": "ICCA/ICN materials on cartel risks", "url": "https://www.internationalcompetitionnetwork.org/"},
        ],
    },
    {
        "id": "third_party_market_access_fee",
        "title": "Agent requests 15% 'market access fee' in a high-risk country.",
        "context": (
            "A local intermediary promises permits and introductions for a time-sensitive project, asking for a 15% success fee. "
            "Basic due diligence flags a politically exposed relative and vague services. The program team says 'we’ll lose funding if we delay.'"
        ),
        "choices": [
            {"key": "A", "label": "Pause engagement; run enhanced due diligence (PEP checks, scope, audit rights), document necessity, and cap/clarify services before any contract.", "score": 3,
             "feedback": "Right path: tighten scope, verify beneficial ownership, add audit/termination rights, and ensure the fee matches legitimate services."},
            {"key": "B", "label": "Proceed now but add anti-bribery reps/warranties and pay only after results.", "score": 1,
             "feedback": "Controls help, but proceeding without enhanced DD in a high-risk context is weak risk management."},
            {"key": "C", "label": "Reject any intermediary use; internal staff will handle approvals informally.", "score": 1,
             "feedback": "Avoids the agent but invites other risks (tipping-off, undue influence). Structure risk, don’t ignore it."},
            {"key": "D", "label": "Split the fee across multiple small contracts to avoid scrutiny.", "score": 0,
             "feedback": "Classic red flag. Fragmentation to evade controls increases misconduct risk."},
        ],
        "resources": [
            {"name": "ISO 37001 (Anti-Bribery) – Third-party controls", "url": "https://www.iso.org/standard/65034.html"},
            {"name": "FCPA/UKBA guidance on intermediaries", "url": "https://www.justice.gov/criminal-fraud/fcpa"},
        ],
    },
    {
        "id": "emergency_procurement_derogation",
        "title": "A 'temporary emergency' is used to skip competition—again.",
        "context": (
            "Operations request a direct award citing 'emergency' to keep services running. Similar waivers were used twice this year; "
            "the same vendor is named as the only viable option. No market scan or written justification is provided."
        ),
        "choices": [
            {"key": "A", "label": "Require written emergency justification, minimum market scan, price reasonableness, and a short-term cap—with a plan to run a full tender within a set date.", "score": 3,
             "feedback": "Balances continuity and integrity: document necessity, scope/price checks, sunset clause, and roadmap to competition."},
            {"key": "B", "label": "Approve as requested—continuity first; you’ll clean it up later.", "score": 0,
             "feedback": "Unchecked repetitive waivers create dependency and corruption exposure."},
            {"key": "C", "label": "Allow a limited direct award but rotate vendors based on informal quotes.", "score": 1,
             "feedback": "Rotation reduces concentration risk but remains opaque without proper justification and record."},
            {"key": "D", "label": "Deny outright and halt operations until a full tender completes.", "score": 1,
             "feedback": "Protects integrity but ignores operational reality; structured interim controls are better."},
        ],
        "resources": [
            {"name": "World Bank – Emergency procurement good practice", "url": "https://www.worldbank.org"},
            {"name": "UNCITRAL – Procurement Model Law (derogations)", "url": "https://uncitral.un.org/"},
        ],
    },
    {
        "id": "nepotism_hidden_subcontractor",
        "title": "Director’s spouse appears as a subcontractor after award.",
        "context": (
            "After awarding a framework agreement, the prime vendor submits a delivery plan that quietly includes the Director’s spouse "
            "as a paid subcontractor. No prior conflict was declared. The Director pressures the team to 'approve quickly—no changes to price.'"
        ),
        "choices": [
            {"key": "A", "label": "Pause approval; disclose the conflict, require the Director’s recusal, and assess whether to remove/replace the subcontractor or rerun the lot.", "score": 3,
             "feedback": "Correct controls: transparency, recusal, and remedy to protect fairness and reputational integrity."},
            {"key": "B", "label": "Approve since pricing is unchanged; note the issue in a private email.", "score": 0,
             "feedback": "Appearance of favoritism persists; private notes don’t fix unmanaged conflicts."},
            {"key": "C", "label": "Allow the subcontractor if an external panel certifies capability.", "score": 1,
             "feedback": "Adds oversight but still weak without recusal and full conflict management."},
            {"key": "D", "label": "Approve conditionally and promise to review at renewal.", "score": 1,
             "feedback": "Defers the problem; risk remains during the current term."},
        ],
        "resources": [
            {"name": "OECD – Managing Conflicts of Interest in the Public Service", "url": "https://www.oecd.org/gov/ethics/"},
            {"name": "TI – Nepotism & patronage guidance", "url": "https://www.transparency.org/"},
        ],
    },
]

# ---------- SESSION / ANALYTICS ----------
if "session_id" not in st.session_state:
    st.session_state.session_id = str(uuid4())
if "responses" not in st.session_state:
    st.session_state.responses = []
if "start_time" not in st.session_state:
    st.session_state.start_time = datetime.utcnow()
if "first_click_s" not in st.session_state:
    st.session_state.first_click_s = None

# Query params (anonymous analytics)
qp = st.query_params  # Streamlit ≥1.31
utm_source = qp.get("utm_source", "")
utm_campaign = qp.get("utm_campaign", "")
ref = qp.get("ref", "")

# ---------- HEADER ----------
st.markdown(
    f"""
    <div style='text-align:center;'>
      <h1 style='margin-bottom:0.2rem;'>🟥 {APP_NAME}</h1>
      <p style='color:{MUTED}; margin-top:0;'>Choose an action in realistic scenarios. Get instant feedback and a score. <i>Training prototype – no legal advice.</i></p>
    </div>
    """,
    unsafe_allow_html=True,
)

with st.expander("About this demo", expanded=False):
    st.write(
        "This MVP offers eight dilemmas touching bribery, conflicts of interest, procurement red flags, collusion, emergency waivers, and retaliation. "
        "We'll later add role-specific variants and AI-generated guidance with citations."
    )

# ---------- USER PROFILE ----------
col1, col2 = st.columns(2)
with col1:
    role = st.selectbox("Your role", ["Student", "Procurement", "Finance", "HR", "Auditor", "Other"], index=1)
with col2:
    region = st.selectbox("Region", ["Europe", "Asia", "Africa", "Americas", "MENA", "Oceania"], index=0)

st.divider()

# Scenario selector (random default)
scenario_titles = [d["title"] for d in DILEMMAS]
if "scenario_title" not in st.session_state:
    st.session_state.scenario_title = random.choice(scenario_titles)

current_index = scenario_titles.index(st.session_state.scenario_title)
scenario_title = st.selectbox(
    "Pick a scenario",
    options=scenario_titles,
    index=current_index,
    key="scenario_title_select",
)
if scenario_title != st.session_state.scenario_title:
    st.session_state.scenario_title = scenario_title

if st.button("Next scenario", use_container_width=True):
    next_idx = (scenario_titles.index(st.session_state.scenario_title) + 1) % len(DILEMMAS)
    st.session_state.scenario_title = scenario_titles[next_idx]
    try:
        st.rerun()
    except AttributeError:
        st.experimental_rerun()

current = next(d for d in DILEMMAS if d["title"] == st.session_state.scenario_title)

st.subheader(current["title"])
st.write(current["context"])

choice_labels = [f"{c['key']}. {c['label']}" for c in current["choices"]]
selected = st.radio("What would you do?", choice_labels, index=None)

# Capture time-to-first-click
if st.session_state.first_click_s is None and selected is not None:
    delta = (datetime.utcnow() - st.session_state.start_time).total_seconds()
    st.session_state.first_click_s = round(delta, 2)

submit = st.button("Submit choice", type="primary", use_container_width=True, disabled=selected is None)

if submit and selected is not None:
    chosen_key = selected.split(".")[0]
    chosen = next(c for c in current["choices"] if c["key"] == chosen_key)

    # Save response
    st.session_state.responses.append({
        "session_id": st.session_state.session_id,
        "ts": datetime.utcnow().isoformat(),
        "dilemma_id": current["id"],
        "choice_key": chosen_key,
        "score": chosen["score"],
        "role": role,
        "region": region,
        "utm_source": utm_source,
        "utm_campaign": utm_campaign,
        "ref": ref,
        "first_click_s": st.session_state.first_click_s,
    })

    response_count = len(st.session_state.responses)

    st.markdown("---")
    st.success(f"Feedback: {chosen['feedback']}")

    if response_count >= 5:
        total = sum(r["score"] for r in st.session_state.responses)
        max_score = response_count * 3
        st.metric(label="Your ethics alignment score (MVP)", value=f"{total} / {max_score}")

        badge = (
            "🏆 Integrity Guardian" if total >= 10 else
            "🛡️ Risk Watcher" if total >= 7 else
            "🧭 Ethics Explorer" if total >= 4 else
            "⚠️ High-Risk Zone"
        )
        st.metric("Status", badge)
    else:
        remaining = 5 - response_count
        st.info(
            "Answer at least five dilemmas to unlock your running score and status badge. "
            f"{remaining} more to go!"
        )

    with st.expander("Learn more – resources"):
        for r in current["resources"]:
            st.markdown(f"- [{r['name']}]({r['url']})")

    df = pd.DataFrame(st.session_state.responses)
    st.download_button(
        label="Download my session (CSV)",
        data=df.to_csv(index=False).encode("utf-8"),
        file_name="redline_simulator_session.csv",
        mime="text/csv",
        use_container_width=True,
    )

    share_link = build_share_url()
    st.text_input(
        "Share this experience",
        value=share_link,
        help="Copy this link with pre-filled UTM tags to share on social or email.",
    )

    st.link_button("Give 20-second feedback", FEEDBACK_URL, use_container_width=True)

    st.info("Play another scenario via the selector above, or use the share link to invite colleagues.")

# ---------- FOOTER ----------
st.markdown(
    f"<p style='text-align:center; color:{MUTED}; margin-top:2rem;'>{APP_NAME} · Prototype for training · No personal data stored · © {datetime.utcnow().year}</p>",
    unsafe_allow_html=True,
)