export const setupExample = {
  getProject: async () => {
  },

  createApp: {
    project_id: "your_project_id",
    name: "AI Quotes App Test",
    type: "test_store",
  },

  createProducts: [
    {
      project_id: "your_project_id",
      store_identifier: "monthly_premium",
      type: "subscription",
      app_id: "your_app_id",
      display_name: "Monthly Premium",
      duration: "P1M",
      title: "Monthly Premium Subscription",
    },
    {
      project_id: "your_project_id",
      store_identifier: "annual_premium",
      type: "subscription",
      app_id: "your_app_id",
      display_name: "Annual Premium",
      duration: "P1Y",
      title: "Annual Premium Subscription",
    },
  ],

  createEntitlement: {
    project_id: "your_project_id",
    lookup_key: "premium",
    display_name: "Premium Access",
  },

  attachProductsToEntitlement: {
    project_id: "your_project_id",
    entitlement_id: "your_entitlement_id",
    product_ids: ["product_id_1", "product_id_2"],
  },

  createOffering: {
    project_id: "your_project_id",
    lookup_key: "default",
    display_name: "Default Offering",
  },

  createPackages: [
    {
      project_id: "your_project_id",
      offering_id: "your_offering_id",
      lookup_key: "$rc_monthly",
      display_name: "Monthly",
      position: 1,
    },
    {
      project_id: "your_project_id",
      offering_id: "your_offering_id",
      lookup_key: "$rc_annual",
      display_name: "Annual",
      position: 2,
    },
  ],

  attachProductsToPackage: {
    project_id: "your_project_id",
    package_id: "your_package_id",
    products: [
      {
        product_id: "your_product_id",
        eligibility_criteria: "all",
      },
    ],
  },

  createPrice: {
    project_id: "your_project_id",
    product_id: "your_product_id",
    prices: [
      { currency: "USD", price: 9.99 },
      { currency: "EUR", price: 8.99 },
    ],
  },
};
