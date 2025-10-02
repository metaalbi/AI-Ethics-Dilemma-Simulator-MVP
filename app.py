import streamlit as st
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


st.markdown("---")
st.success(f"Feedback: {chosen['feedback']}")


total = sum(r["score"] for r in st.session_state.responses)
st.metric(label="Your ethics alignment score (MVP)", value=f"{total} / {3}")


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


st.info("Play another scenario via the selector above, or share this link with ?utm_source= where you post it.")


# ---------- FOOTER ----------
st.markdown(
f"<p style='text-align:center; color:{MUTED}; margin-top:2rem;'>"
f"{APP_NAME} · Prototype for training · No personal data stored · © {datetime.utcnow().year}</p>",
unsafe_allow_html=True,
)