# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Create your account" [level=2] [ref=e5]
      - paragraph [ref=e6]:
        - text: Or
        - link "sign in to your existing account" [ref=e7] [cursor=pointer]:
          - /url: /auth/login
    - generic [ref=e8]:
      - generic [ref=e9]:
        - textbox "Full Name" [ref=e11]
        - textbox "Email address" [ref=e13]
        - textbox "Password" [ref=e15]
      - button "Sign up" [ref=e17] [cursor=pointer]
    - generic [ref=e18]:
      - generic [ref=e23]: Or continue with
      - generic [ref=e24]:
        - button "Google Google" [ref=e26] [cursor=pointer]:
          - img "Google" [ref=e27]
          - text: Google
        - button "Microsoft Microsoft" [ref=e29] [cursor=pointer]:
          - img "Microsoft" [ref=e30]
          - text: Microsoft
  - button "Open Next.js Dev Tools" [ref=e36] [cursor=pointer]:
    - img [ref=e37]
  - alert [ref=e40]
```