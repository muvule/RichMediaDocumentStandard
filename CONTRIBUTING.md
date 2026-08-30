# Contributing to the Rich Media Document (RMD) Standard

Thank you for your interest in contributing to the RMD Standard! We welcome contributions to the specification, reference parsers, CLI tooling, and web playground.

---

## 1. Code of Conduct

All contributors are expected to adhere to the **[Code of Conduct](CODE_OF_CONDUCT.md)** (Contributor Covenant v2.1).

---

## 2. Development Setup

### Prerequisites
* **Node.js**: `v18.0.0` or higher
* **npm**: `v9.0.0` or higher
* **Git**

### Installation
```bash
# Clone the repository
git clone https://github.com/muvule/RichMediaDocumentStandard.git
cd RichMediaDocumentStandard

# Install monorepo dependencies
npm install

# Build all packages
npm run build

# Run automated test suite
npm test

# Run performance benchmark suite
npm run benchmark

# Start the interactive playground locally
npm run playground
```

---

## 3. Pull Request Guidelines

1. **Branch Naming:** Use semantic branch names (e.g. `feat/spatial-polygon-selector`, `fix/validator-bounds`, `docs/spec-clarification`).
2. **Commit Conventions:** Follow [Conventional Commits](https://www.conventionalcommits.org/):
   * `feat:` A new feature or selector type
   * `fix:` A bug fix in parser, lexer, or validator
   * `docs:` Documentation or specification changes
   * `test:` Adding missing tests
   * `refactor:` Code refactoring without behavioral changes
3. **Automated Testing:** Ensure all tests pass (`npm test`) and run schema validation before submitting.
4. **Specification Changes:** Any proposal to modify block attributes or selector schemas MUST be accompanied by an RFC issue using the **Spec RFC Template**.
