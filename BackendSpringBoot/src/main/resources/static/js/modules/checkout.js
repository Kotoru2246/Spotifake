// Split from the former site.js (feature: checkout). See docs/architecture.md.
import { state } from './state.js';
import { authRoleKey, authTokenKey, authUserKey, authenticatedFetch } from './api.js';
import { renderLyrics } from './lyrics.js';
import { getCurrentQueue } from './queue.js';
import { setModalOpen, showToast } from './utils.js';

export function updatePremiumUI(user) {
  const isPrem = !!(user && (user.isPremium || user.premium || user.subscriptionTier === 'Premium'));
  const premiumBtn = document.getElementById('explorePremiumBtn');
  const premiumBadge = document.getElementById('premiumBadge');

  if (premiumBtn) premiumBtn.style.display = isPrem ? 'none' : 'inline-flex';
  if (premiumBadge) premiumBadge.style.display = isPrem ? 'inline-flex' : 'none';

  // If lyrics are currently rendered, refresh them
  const lyricsSection = document.getElementById('lyrics-view');
  if (lyricsSection && !lyricsSection.classList.contains('hidden') && lyricsSection.style.display !== 'none') {
    renderLyrics();
  }
}

export function openCheckoutModal(planType = 'Individual') {
  const modal = document.getElementById('checkoutModal');
  if (!modal) return;
  modal.style.display = 'flex';
  modal.hidden = false;
  modal.classList.remove('modal-hidden');
  selectPlan(planType, planType === 'Duo' ? 6.99 : (planType === 'Family' ? 9.99 : 4.99));
  const err = document.getElementById('checkoutError');
  if (err) err.style.display = 'none';
}

export function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (!modal) return;
  modal.style.display = 'none';
  modal.hidden = true;
}

export function selectPlan(plan, price) {
  state.selectedCheckoutPlan = plan;
  state.selectedCheckoutPrice = price;

  document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('active'));
  const targetCard = document.getElementById('plan' + plan);
  if (targetCard) targetCard.classList.add('active');

  const nameEl = document.getElementById('summaryPlanName');
  const priceEl = document.getElementById('summaryPlanPrice');
  const totalEl = document.getElementById('summaryTotal');
  const btnText = document.getElementById('checkoutBtnText');

  if (nameEl) nameEl.textContent = `Spotifake ${plan} Plan`;
  if (priceEl) priceEl.textContent = `$${price.toFixed(2)} / mo`;
  if (totalEl) totalEl.textContent = `$${price.toFixed(2)}`;
  if (btnText) btnText.textContent = `Complete Purchase • $${price.toFixed(2)}`;
}

export function handleCardNumberInput(e) {
  let input = e.target;
  let digits = input.value.replace(/\D/g, '').substring(0, 16);
  let formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  input.value = formatted;

  const brand = detectCardBrand(digits);
  const brandLogo = document.getElementById('mockBrandLogo');
  const brandIndicator = document.getElementById('ccBrandIndicator');
  if (brandLogo) brandLogo.textContent = brand.toUpperCase();
  if (brandIndicator) {
    if (brand === 'Visa') brandIndicator.textContent = '💳 Visa';
    else if (brand === 'Mastercard') brandIndicator.textContent = '💳 MC';
    else if (brand === 'Amex') brandIndicator.textContent = '💳 Amex';
    else if (brand === 'Discover') brandIndicator.textContent = '💳 Disc';
    else brandIndicator.textContent = '💳';
  }

  const mockNum = document.getElementById('mockCardNumber');
  if (mockNum) {
    mockNum.textContent = formatted || '•••• •••• •••• ••••';
  }
}

export function handleExpiryInput(e) {
  let input = e.target;
  let digits = input.value.replace(/\D/g, '').substring(0, 4);
  if (digits.length >= 2) {
    input.value = digits.substring(0, 2) + '/' + digits.substring(2);
  } else {
    input.value = digits;
  }
  const mockExp = document.getElementById('mockCardExpiry');
  if (mockExp) {
    mockExp.textContent = input.value || 'MM/YY';
  }
}

export function updateCardMockup() {
  const nameInput = document.getElementById('ccName');
  const mockHolder = document.getElementById('mockCardHolder');
  if (mockHolder && nameInput) {
    mockHolder.textContent = nameInput.value.trim() ? nameInput.value.toUpperCase() : 'YOUR NAME';
  }
}

export function detectCardBrand(digits) {
  if (!digits) return 'CARD';
  if (digits.startsWith('4')) return 'Visa';
  if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(digits)) return 'Mastercard';
  if (/^(34|37)/.test(digits)) return 'Amex';
  if (/^(6011|65|64[4-9])/.test(digits)) return 'Discover';
  return 'Card';
}

export function fillTestCard(type) {
  const nameInput = document.getElementById('ccName');
  const numInput = document.getElementById('ccNumber');
  const expInput = document.getElementById('ccExpiry');
  const cvcInput = document.getElementById('ccCvc');
  const zipInput = document.getElementById('ccZip');

  if (nameInput) nameInput.value = 'Jane Doe';
  if (expInput) expInput.value = '12/28';
  if (cvcInput) cvcInput.value = '123';
  if (zipInput) zipInput.value = '90210';

  if (type === 'decline_funds') {
    if (numInput) numInput.value = '4242 4242 4242 0002';
  } else if (type === 'decline_expired') {
    if (numInput) numInput.value = '4242 4242 4242 0003';
    if (expInput) expInput.value = '01/20';
  } else if (type === 'decline_fraud') {
    if (numInput) numInput.value = '4242 4242 4242 0004';
  } else {
    // Valid card
    if (numInput) numInput.value = '4242 4242 4242 4242';
  }

  if (numInput) handleCardNumberInput({ target: numInput });
  if (expInput) handleExpiryInput({ target: expInput });
  updateCardMockup();
}

export async function handleCheckoutSubmit(e) {
  if (e) e.preventDefault();

  const submitBtn = document.getElementById('checkoutSubmitBtn');
  const spinner = document.getElementById('checkoutSpinner');
  const btnText = document.getElementById('checkoutBtnText');
  const errBox = document.getElementById('checkoutError');

  const name = document.getElementById('ccName')?.value || '';
  const number = document.getElementById('ccNumber')?.value || '';
  const expiry = document.getElementById('ccExpiry')?.value || '';
  const cvc = document.getElementById('ccCvc')?.value || '';
  const zip = document.getElementById('ccZip')?.value || '';

  if (errBox) { errBox.style.display = 'none'; errBox.textContent = ''; }
  if (submitBtn) submitBtn.disabled = true;
  if (spinner) spinner.style.display = 'inline-block';

  const headers = { 'Content-Type': 'application/json' };
  if (state.authToken) {
    headers['Authorization'] = 'Bearer ' + state.authToken;
  }

  try {
    const res = await fetch('/api/subscription/checkout', {
      method: 'POST',
      headers: headers,
      credentials: 'same-origin',
      body: JSON.stringify({
        planType: state.selectedCheckoutPlan,
        cardholderName: name,
        cardNumber: number,
        expiryDate: expiry,
        cvc: cvc,
        billingZip: zip,
        username: state.currentUser?.username || 'user_test'
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      if (errBox) {
        errBox.textContent = data.message || 'Payment processing failed. Please check your card details.';
        errBox.style.display = 'block';
      }
      showToast('error', 'Payment Failed', data.message || 'Payment declined.');
      return;
    }

    // Success!
    if (data.token) {
      state.authToken = data.token;
      localStorage.setItem(authTokenKey, state.authToken);
    }
    if (data.user) {
      state.currentUser = data.user;
      localStorage.setItem(authUserKey, state.currentUser.username || '');
      localStorage.setItem(authRoleKey, state.currentUser.role || 'user');
    } else if (state.currentUser) {
      state.currentUser.isPremium = true;
      state.currentUser.subscriptionTier = 'Premium';
    }
    updatePremiumUI(state.currentUser);

    // Close checkout modal
    closeCheckoutModal();

    // Show receipt modal
    state.currentTransactionId = data.transactionId || 'TX-SUCCESS';
    const rTx = document.getElementById('receiptTxId');
    const rPlan = document.getElementById('receiptPlan');
    const rAmt = document.getElementById('receiptAmount');
    const rCard = document.getElementById('receiptCard');
    const rAuth = document.getElementById('receiptAuth');

    if (rTx) rTx.textContent = '#' + state.currentTransactionId;
    if (rPlan) rPlan.textContent = `${data.planType} ($${data.amount.toFixed(2)}/mo)`;
    if (rAmt) rAmt.textContent = `$${data.amount.toFixed(2)}`;
    if (rCard) rCard.textContent = `${data.cardBrand} •••• ${data.cardLast4}`;
    if (rAuth) rAuth.textContent = data.authCode || 'AUTH-OK';

    const receiptModal = document.getElementById('receiptModal');
    if (receiptModal) {
      receiptModal.style.display = 'flex';
      receiptModal.hidden = false;
      receiptModal.classList.remove('modal-hidden');
    }

    showToast('success', 'Upgraded to Premium!', 'Enjoy unlimited skips and ad-free listening.');
  } catch (err) {
    if (errBox) {
      errBox.textContent = 'Network or server error during checkout: ' + err.message;
      errBox.style.display = 'block';
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (spinner) spinner.style.display = 'none';
  }
}

export function openPrintableReceipt() {
  if (!state.currentTransactionId) return;
  window.open('/api/subscription/receipt/' + encodeURIComponent(state.currentTransactionId), '_blank');
}

export function closeReceiptModal() {
  const modal = document.getElementById('receiptModal');
  if (modal) {
    modal.style.display = 'none';
    modal.hidden = true;
  }
}

export function openReportSongModal(targetTrack) {
  let track = targetTrack;
  if (!track) {
    const q = typeof getCurrentQueue === 'function' ? getCurrentQueue() : (typeof state.activeQueue !== 'undefined' && state.activeQueue && state.activeQueue.length > 0 ? state.activeQueue : (typeof state.tracks !== 'undefined' ? state.tracks : []));
    if (q && q.length > 0 && typeof state.currentTrackIndex === 'number' && q[state.currentTrackIndex]) {
      track = q[state.currentTrackIndex];
    }
  }

  if (!track) {
    const pTrack = document.getElementById('playerTrack');
    const pArtist = document.getElementById('playerArtist');
    if (pTrack && pTrack.textContent && pTrack.textContent !== 'No Track Selected' && pTrack.textContent !== 'No Tracks Available') {
      track = {
        title: pTrack.textContent.trim(),
        displayName: pTrack.textContent.trim(),
        artist: pArtist ? pArtist.textContent.trim() : '',
        id: pTrack.dataset ? (pTrack.dataset.songId || '') : ''
      };
    }
  }

  const modal = document.getElementById('reportSongModal');
  if (!modal) {
    console.warn('reportSongModal element not found in DOM');
    return;
  }

  const idInput = document.getElementById('reportSongId');
  const titleInput = document.getElementById('reportSongTitle');
  const subtitle = document.getElementById('reportSongSubtitle');
  const descInput = document.getElementById('reportDescription');

  if (track) {
    const trackTitle = track.displayName || track.title || track.Title || 'Unknown Track';
    const trackArtist = track.artist || track.Artist || '';
    const fullTrackName = trackArtist ? `${trackTitle} - ${trackArtist}` : trackTitle;

    if (idInput) idInput.value = track.id || track.Id || track.fileName || '';
    if (titleInput) {
      titleInput.value = fullTrackName;
      titleInput.readOnly = true;
    }
    if (subtitle) subtitle.textContent = `Reporting "${fullTrackName}" to moderators`;
  } else {
    if (idInput) idInput.value = '0';
    if (titleInput) {
      titleInput.value = '';
      titleInput.placeholder = 'Type song title or describe the audio issue...';
      titleInput.readOnly = false;
    }
    if (subtitle) subtitle.textContent = 'Report an audio or metadata issue to moderators';
  }

  if (descInput) descInput.value = '';

  if (typeof setModalOpen === 'function') {
    setModalOpen(modal, true);
  } else {
    modal.hidden = false;
    modal.removeAttribute('hidden');
    modal.style.display = 'flex';
  }
}

export function closeReportSongModal() {
  const modal = document.getElementById('reportSongModal');
  if (modal) {
    if (typeof setModalOpen === 'function') {
      setModalOpen(modal, false);
    } else {
      modal.style.display = 'none';
      modal.hidden = true;
    }
  }
}

export async function submitSongReport() {
  const id = document.getElementById('reportSongId')?.value;
  const title = document.getElementById('reportSongTitle')?.value;
  const reason = document.getElementById('reportReason')?.value || 'Inappropriate Content';
  const description = document.getElementById('reportDescription')?.value || '';
  const btn = document.getElementById('btnSubmitSongReport');

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Submitting...';
  }

  try {
    const response = await authenticatedFetch('/api/music/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        songId: id,
        title: title,
        reason: reason,
        description: description
      })
    });

    const res = await response.json().catch(() => ({}));
    if (response.ok && (res.success || res.status === 200)) {
      showToast('success', 'Report Submitted', 'Thank you! Our moderation team has received your report.');
      closeReportSongModal();
    } else {
      showToast('error', 'Report Failed', res.message || 'Could not submit report.');
    }
  } catch (err) {
    showToast('error', 'Network Error', 'Failed to communicate with reporting service.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Submit Report';
    }
  }
}
