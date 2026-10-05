// Read-only preflight over verified execution-path facts; no provider/billing calls.
export function prepaidAudioDecision(s){
 const out=(code,extra={})=>({code,stopScope:'PAID_AUDIO_BRANCH_ONLY',independentNonAudioContinues:true,...extra});
 if(s.product!=='MAN'||s.contentScope!=='OFFICIAL_ONLY'||s.reservedOfficialIdentity!==true||!s.reservedIdentityEvidenceSha256||s.standingAuthority!==true)return out('OUTSIDE_STANDING_AUDIO_AUTHORITY');
 if(s.providerOrBillingChange||s.autoTopUp||s.newBillingCommitment||s.increaseBudget)return out('OWNER_DECISION_REQUIRED');
 if(s.exactAssetPass===true&&s.bindingMatches===true)return out('REUSE_NO_PAID_CALL',{paidCallAllowed:false});
 if(s.balanceVerified!==true||!s.balanceEvidenceRef||!s.costEstimateEvidenceRef||s.currency!=='USD')return out('AUDIO_BUDGET_RECONCILIATION_REQUIRED');
 for(const n of ['prepaidUsd','unsettledUsd','reservedUsd','nextCostUpperBoundUsd'])if(!Number.isFinite(s[n])||s[n]<0)return out('AUDIO_BUDGET_RECONCILIATION_REQUIRED');
 // Quantize to microdollars conservatively; avoid binary-float extra-cent top-up.
 const micro=v=>Math.round(v*1e6);
 if(['prepaidUsd','unsettledUsd','reservedUsd','nextCostUpperBoundUsd'].some(n=>!Number.isSafeInteger(micro(s[n]))||Math.abs(micro(s[n])/1e6-s[n])>1e-10))return out('AUDIO_BUDGET_RECONCILIATION_REQUIRED');
 const availableMicro=Math.max(0,micro(s.prepaidUsd)-micro(s.unsettledUsd)-micro(s.reservedUsd)),costMicro=micro(s.nextCostUpperBoundUsd),available=availableMicro/1e6;
 if(costMicro>availableMicro)return out('OWNER_FUNDING_REQUIRED',{paidCallAllowed:false,availableUsd:available,minimumTopUpUsd:Math.ceil((costMicro-availableMicro)/10000)/100,estimateBasis:s.costEstimateEvidenceRef});
 if(s.hardControlsPermit!==true)return out('AUDIO_EXECUTION_CONTROL_BLOCKED');
 return out('RESERVE_THEN_TARGETED_AUDIO',{paidCallAllowed:true,reserveUsd:s.nextCostUpperBoundUsd,availableUsd:available});
}
