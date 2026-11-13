---
name: company-rules
description: "Apply relevant company AL rules; detailed PASS/FAIL reporting only for explicit review/full-mode DoD."
user-invocable: false
---

# Company Rules

The rules in `rules/` are this company's opinions about AL, one article per rule, each with a
`.good.al` and a `.bad.al` sample where available. The articles are **mandatory**.

They come **on top of BCQuality**, not instead of it. BCQuality is the general layer
(Microsoft + community best practice) and still applies in full; the company rules add what
your shop decided on top. Where the two disagree, the company rule wins.

This skill returns rules, not answers: after reading them, **you** apply each one to the code
at hand.

## When to use

- Before writing AL (`AL-implement`, `al-sdd`); in design only when a rule affects a decision.
- Reviewing AL and internal DoD line D7.

## Procedure

### 1. Enumerate the folder

List `rules/*.md` except `README.md`. **Never work from a remembered or fixed list**: the
folder is the list. An empty folder is fine: report "no company rules" and stop.

### 2. Select what applies

Read each article's frontmatter `keywords` and its `## Description`. A rule applies when the
code at hand contains what it talks about (a tableextension, a page, a Label, a Meth
codeunit, any `.al` file). In doubt, include it: a rule is cheap to check and expensive to
miss.

### 3. Read the selected rules in full

Use targeted ranges and reuse articles already read this session. Read a sample only when
the pattern is unclear; respect bc-workflow's research budget. Follow the article's `## Best
Practice` and `## Anti Pattern`; its `## Description` says how to check. Do not follow samples
that the article explicitly identifies as retired.

### 4. Apply

- **Writing code:** follow the article and any applicable `.good.al` pattern; never emit the
  applicable `.bad.al` pattern.
- **Designing:** mention only rules that materially affect a business/design decision;
  do not pad the spec with a rule checklist.
- **Checking:** run the check from the rule's Description on every changed `.al` file.

### 5. Report (checking)

```
Company rules (rules/, 5 found, 4 applicable)
  PASS  tableextension-field-affix         app/src/DIRCustomer.TableExt.al:5 "DIR Preferred Carrier"
  FAIL  label-naming                       app/src/DIRCustomerCheckCarrierMeth.Codeunit.al:22
        CarrierLabel passed to Error() -> rename to NoPreferredCarrierErr
  PASS  single-object-per-file             6 files, 1 object each
  PASS  page-no-local-procedures           app/src/DIRCustomerCard.PageExt.al: no local procedure
  N/A   meth-codeunit-single-public-procedure   no Meth codeunit in the change
```

Every line has evidence (`file:line`) or, for N/A, the reason. A FAIL on a company rule blocks
done.

## Never

- Never add a rule to this skill. A rule is a file in `rules/`.
- Never soften a rule because general guidance says otherwise: the company rule wins.

## Related

- `rules/README.md` - how to write a rule.
- `definition-of-done` - D7 runs step 5 of this skill.
- `al-knowledge` - general guidance, which these rules override.