<script setup lang="ts">
// RenderText (ported). Parses the OATutor custom markdown dialect and renders it:
//   $$latex$$      -> MathText (MathJax)
//   ##media##      -> figure image (/static/images/figures/<src>/<problemID>/<file>)
//   \n             -> line break
//   ___ (3+)       -> fill-in-the-blank box
//   %{key}         -> context meta variable
//   %X%            -> dynamicText expansion
// plus \neq -> ≠, ** -> ^, and variabilization.
import { variabilize } from '@core/platform-logic/variabilize'
import { CONTENT_SOURCE } from '@common/global-config'
import { dynamicText } from '@/shared/config'
import MathText from '@/components/MathText.vue'

interface Ctx { userID?: string }
const props = defineProps<{
  text?: string | null
  problemID?: string
  variabilization?: Record<string, unknown>
  context?: Ctx | null
}>()

type Token =
  | { type: 'math'; value: string }
  | { type: 'media'; value: string }
  | { type: 'text'; segments: string[] }
interface Line { tokens: Token[] }

const META_RE = /%\{([^{}%"]+)}/g
const metaMap: Record<string, (c: Ctx) => string> = {
  oats_user_id: c => c.userID ?? '',
}

function splitBlank(str: string): string[] {
  return str.split(/_{3,}/)
}

const lines = computed<Line[]>(() => {
  let t = props.text
  if (typeof t !== 'string') return []
  t = t.replaceAll('\\neq', '≠').replaceAll('**', '^')
  t = t.replaceAll(META_RE, (m, g) =>
    g in metaMap ? metaMap[g](props.context ?? {}) : m,
  )
  for (const d in dynamicText) t = t.split(d).join(dynamicText[d])
  if (props.variabilization) t = variabilize(t, props.variabilization) as string

  return t.split('\\n').map((line) => {
    const tokens: Token[] = []
    line.split('$$').forEach((part, j) => {
      if (j % 2 === 1) {
        if (/^_{3,}$/.test(part)) tokens.push({ type: 'text', segments: splitBlank(part) })
        else tokens.push({ type: 'math', value: part })
        return
      }
      part.split('##').forEach((sub, k) => {
        if (k % 2 === 1) tokens.push({ type: 'media', value: sub })
        else tokens.push({ type: 'text', segments: splitBlank(sub) })
      })
    })
    return { tokens }
  })
})

function mediaUrl(url: string): string {
  return `/static/images/figures/${CONTENT_SOURCE}/${props.problemID ?? ''}/${url}`
}
</script>

<template>
  <span>
    <span v-for="(line, li) in lines" :key="li" class="rt-line">
      <template v-for="(tok, ti) in line.tokens" :key="ti">
        <MathText v-if="tok.type === 'math'" :math="tok.value" />
        <span v-else-if="tok.type === 'media'" class="rt-media">
          <img :src="mediaUrl(tok.value)" :alt="tok.value">
        </span>
        <span v-else>
          <template v-for="(seg, si) in tok.segments" :key="si">
            <span v-if="si > 0" class="rt-blank" aria-label="fill in the blank" />
            <span>{{ seg }}</span>
          </template>
        </span>
      </template>
    </span>
  </span>
</template>

<style scoped>
.rt-line { display: block; }
.rt-media { display: block; text-align: center; margin: 4px 0; }
.rt-media img { max-width: 100%; }
.rt-blank {
  display: inline-block;
  margin: 0 0.5ch;
  padding: 0 2.5ch;
  height: 1.4em;
  vertical-align: middle;
  background: rgb(242 243 244);
  border-radius: 0.6ch;
  position: relative;
}
.rt-blank::after {
  content: '';
  position: absolute;
  left: 4px;
  right: 4px;
  bottom: 3px;
  height: 1.5px;
  background: rgb(75 76 77);
  border-radius: 0.6ch;
}
</style>
