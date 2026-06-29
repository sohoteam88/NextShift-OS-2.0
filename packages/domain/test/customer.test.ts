import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  Customer,
  InMemoryCustomerRepository,
  type CustomerId,
} from "../src/customer";

const businessId = "business-1" as BusinessId;
const customerId = "customer-1" as CustomerId;
const createdAt = "2026-06-27T00:00:00.000Z";

function createCustomer(): Customer {
  return Customer.create({
    customerId,
    businessId,
    displayName: "Acme Buyer",
    email: "BUYER@EXAMPLE.COM",
    type: "organization",
    tags: ["vip", "vip", " active "],
    createdAt,
  });
}

describe("Customer aggregate", () => {
  it("creates a customer", () => {
    const customer = createCustomer();

    expect(customer.toSnapshot()).toMatchObject({
      customerId,
      businessId,
      displayName: "Acme Buyer",
      email: "buyer@example.com",
      status: "active",
      type: "organization",
      communicationPreference: "email",
      tags: ["vip", "active"],
      createdAt,
      updatedAt: createdAt,
    });
  });

  it("fails without a display name", () => {
    expect(() =>
      Customer.create({
        customerId,
        businessId,
        displayName: " ",
        email: "buyer@example.com",
        createdAt,
      })
    ).toThrow("Customer display name is required.");
  });

  it("fails without a contact method", () => {
    expect(() =>
      Customer.create({
        customerId,
        businessId,
        displayName: "Acme Buyer",
        createdAt,
      })
    ).toThrow("At least one contact method is required.");
  });

  it("updates a customer", () => {
    const customer = createCustomer();

    customer.updateProfile({
      displayName: "Acme Champion",
      phone: "+60123456789",
      communicationPreference: "phone",
      updatedAt: "2026-06-27T01:00:00.000Z",
    });

    expect(customer.toSnapshot()).toMatchObject({
      displayName: "Acme Champion",
      phone: "+60123456789",
      communicationPreference: "phone",
      updatedAt: "2026-06-27T01:00:00.000Z",
    });
  });

  it("prevents updating archived customers", () => {
    const customer = createCustomer();

    customer.archive("2026-06-27T02:00:00.000Z");

    expect(() =>
      customer.updateProfile({
        displayName: "Archived Buyer",
        updatedAt: "2026-06-27T03:00:00.000Z",
      })
    ).toThrow("Archived customers cannot be modified.");
  });

  it("archives a customer", () => {
    const customer = createCustomer();

    customer.archive("2026-06-27T02:00:00.000Z");

    expect(customer.toSnapshot()).toMatchObject({
      status: "archived",
      archivedAt: "2026-06-27T02:00:00.000Z",
      updatedAt: "2026-06-27T02:00:00.000Z",
    });
  });

  it("restores a customer", () => {
    const customer = createCustomer();

    customer.archive("2026-06-27T02:00:00.000Z");
    customer.restore("2026-06-27T03:00:00.000Z");

    expect(customer.toSnapshot()).toMatchObject({
      status: "active",
      archivedAt: undefined,
      updatedAt: "2026-06-27T03:00:00.000Z",
    });
  });
});

describe("InMemoryCustomerRepository", () => {
  it("saves and retrieves a customer by ID", async () => {
    const repository = new InMemoryCustomerRepository();
    const customer = createCustomer();

    await repository.save(customer);

    expect((await repository.findById(customerId))?.toSnapshot()).toEqual(
      customer.toSnapshot()
    );
  });

  it("finds a customer by email", async () => {
    const repository = new InMemoryCustomerRepository();

    await repository.save(createCustomer());

    expect(await repository.findByEmail("BUYER@example.com")).not.toBeNull();
  });

  it("finds a customer by phone", async () => {
    const repository = new InMemoryCustomerRepository();
    const customer = Customer.create({
      customerId,
      businessId,
      displayName: "Phone Buyer",
      phone: "+60123456789",
      createdAt,
    });

    await repository.save(customer);

    expect(await repository.findByPhone("+60123456789")).not.toBeNull();
  });

  it("checks customer existence", async () => {
    const repository = new InMemoryCustomerRepository();

    expect(await repository.exists(customerId)).toBe(false);

    await repository.save(createCustomer());

    expect(await repository.exists(customerId)).toBe(true);
  });

  it("archives a customer", async () => {
    const repository = new InMemoryCustomerRepository();

    await repository.save(createCustomer());
    await repository.archive(customerId, "2026-06-27T02:00:00.000Z");

    expect((await repository.findById(customerId))?.toSnapshot()).toMatchObject({
      status: "archived",
      archivedAt: "2026-06-27T02:00:00.000Z",
    });
  });
});
