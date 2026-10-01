import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GuestbookForm } from "./guestbook-form";

describe("GuestbookForm: honeypot anti-bot", () => {
  it("merender field honeypot tersembunyi di luar layar, bukan display:none atau type=hidden", () => {
    const { container } = render(<GuestbookForm context="umum" nonce="test-nonce" />);

    // biome-ignore lint/security/noSecrets: selector CSS biasa, bukan kredensial sungguhan.
    const honeypot = container.querySelector<HTMLInputElement>('input[name="website"]');
    expect(honeypot).not.toBeNull();

    // Skrip generik yang hanya memeriksa style.display/visibility tetap
    // mengisinya (Bagian 9 prompt), karena itu field TIDAK boleh display:none,
    // TIDAK boleh visibility:hidden, dan TIDAK boleh type="hidden" (yang
    // membuat field tidak pernah bisa "diisi" lewat DOM oleh sebagian skrip).
    expect(honeypot?.type).not.toBe("hidden");
    expect(honeypot?.style.display).not.toBe("none");
    expect(honeypot?.style.visibility).not.toBe("hidden");
    expect(honeypot?.tabIndex).toBe(-1);
    expect(honeypot?.autocomplete).toBe("off");

    const wrapper = honeypot?.closest('[aria-hidden="true"]');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.className).toContain("left-[-9999px]");
  });

  it("merender field name dan message asli dengan atribut required", () => {
    const { container } = render(<GuestbookForm context="wisuda" nonce="test-nonce" />);

    // biome-ignore lint/security/noSecrets: selector CSS biasa, bukan kredensial sungguhan.
    const nameInput = container.querySelector<HTMLInputElement>('input[name="name"]');
    const messageInput = container.querySelector<HTMLTextAreaElement>('textarea[name="message"]');

    expect(nameInput?.required).toBe(true);
    expect(messageInput?.required).toBe(true);
  });
});
