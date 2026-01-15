# Recommended Packages

## Essential Tools

```bash
pkg_add vim git curl wget rsync
```

## Development

```bash
pkg_add node python3 go rust
```

## Desktop

```bash
pkg_add firefox chromium gimp vlc
```

## Tips

Always verify checksums!

```bash
sha256 filename
signify -Vep /etc/signify/openbsd-74-base.pub -m SHA256.sig
```
