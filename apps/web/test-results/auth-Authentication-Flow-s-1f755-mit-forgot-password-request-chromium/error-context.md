# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Forgot your password?" [level=2] [ref=e5]
      - paragraph [ref=e6]: Enter your email and we'll send you a reset link.
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]: Email address
        - textbox "Email address" [ref=e10]
      - button "Send reset link" [ref=e11] [cursor=pointer]
      - link "Back to login" [ref=e13] [cursor=pointer]:
        - /url: /auth/login
  - button "Open Next.js Dev Tools" [ref=e19] [cursor=pointer]:
    - img [ref=e20]
  - alert [ref=e23]
```