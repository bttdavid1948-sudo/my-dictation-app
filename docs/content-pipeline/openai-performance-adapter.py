"""Small provider adapter. No credential handling or Curriculum transformations."""
def instructions(profile):
    assert profile['profile_version'] == 'v1'
    assert profile['language_locale'] == 'en-US'
    assert profile['text_fidelity'] == 'VERBATIM_NO_ADDITIONS_OR_OMISSIONS'
    assert profile['pace'] == 'MEASURED_CONVERSATIONAL_APPROX_150_WPM'
    assert profile['phrase_boundaries'] in {'SENTENCES_AND_CLAUSES','WRITTEN_PUNCTUATION'}
    parts = ['Read the supplied text exactly, including all small words and verb endings. Do not insert filler words, paraphrase, expand contractions, spell words, or add commentary.',
             'Use natural conversational American English in the assigned speaker voice.',
             'Use a measured conversational pace, approximately 150 words per minute. Keep every word audible without making the speech word-by-word.']
    if profile['phrase_boundaries'] == 'SENTENCES_AND_CLAUSES':
        parts.append('Use brief natural pauses at sentence and clause boundaries so the multi-clause instruction forms clear thought groups. Do not add long pauses inside a phrase.')
    else:
        parts.append('Follow the written punctuation with brief natural pauses and the question intonation.')
    modes = {'simple_reductions': 'Keep natural connected speech and the written contractions, particularly We\'ve moved; do not expand them.',
             'basic_contractions': 'Realize written contractions such as doesn\'t and It\'s naturally, without expanding them.',
             'unstressed_function_words': 'Keep function words naturally unstressed but present; do not emphasize articles, prepositions or auxiliaries artificially.',
             'common_reductions': 'Use ordinary conversational linking and reductions without dropping words or swallowing verb endings.',
             'natural': 'Use ordinary connected speech without exaggerated emphasis.'}
    parts.append(modes[profile['connected_speech']])
    return ' '.join(parts)
