import streamlit as st
import pandas as pd
from datetime import datetime
from uuid import uuid4
import random


# ---------- CONFIG ----------
st.set_page_config(
page_title="Red Line – Anti‑Corruption Simulator",
page_icon="🟥",
layout="centered",
)


PRIMARY = "#0ea5e9" # sky-500
ACCENT = "#14b8a6" # teal-500
DANGER = "#ef4444" # red-500
MUTED = "#64748b" # slate-500


APP_NAME = "Red Line – Anti‑Corruption Simulator"
FEEDBACK_URL = "https://forms.gle/replace-with-your-form" # <-- replace when you have a form


# ---------- DILEMMAS (ENGAGING, TRICKY) ----------
DILEMMAS = [
{
"id": "bribe_supervisor_email",
"title": "Your supervisor suggests a ‘facilitation payment’.",
"context": (
"You're a procurement officer. A supplier hints a contract will be expedited if you approve a small "
"'facilitation payment'. Your supervisor forwards the request and writes: 'This is how things get done—don’t overthink it.'"
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
)