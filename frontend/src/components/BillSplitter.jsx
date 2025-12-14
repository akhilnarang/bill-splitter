import React, { useState, useMemo, useCallback } from "react";
import { Trash2, X, Plus, Upload, ArrowLeft, Receipt } from "lucide-react";

const BillSplitter = () => {
  const [bills, setBills] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBillId, setEditingBillId] = useState(null);
  const [paymentPlans, setPaymentPlans] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [paidBy, setPaidBy] = useState("");
  const [taxRate, setTaxRate] = useState("5");
  const [serviceCharge, setServiceCharge] = useState("0");
  const [items, setItems] = useState([{ name: "", price: 0, quantity: 1, consumed_by: [] }]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const resetForm = useCallback(() => {
    setPaidBy("");
    setTaxRate("5");
    setServiceCharge("0");
    setItems([{ name: "", price: 0, quantity: 1, consumed_by: [] }]);
    setEditingBillId(null);
  }, []);

  const handleAddBill = () => {
    setShowModal(true);
    setShowResults(false);
    setPaymentPlans([]);
    resetForm();
  };

  const handleEditBill = (bill) => {
    setEditingBillId(bill.id);
    setPaidBy(bill.paid_by);
    setTaxRate((bill.tax_rate * 100).toString());
    setServiceCharge((bill.service_charge * 100).toString());
    setItems(bill.items);
    setShowModal(true);
    setShowResults(false);
    setPaymentPlans([]);
  };

  const handleDeleteBill = (id) => {
    setBills(bills.filter((b) => b.id !== id));
  };

  const handleSaveBill = useCallback(() => {
    if (!paidBy.trim()) {
      alert("Please enter who paid the bill");
      return;
    }

    const validItems = items.filter(
      (item) => item.name.trim() && item.price > 0 && item.quantity > 0 && item.consumed_by.length > 0,
    );

    if (validItems.length === 0) {
      alert("Please add at least one valid item with consumers");
      return;
    }

    const bill = {
      id: editingBillId || Date.now().toString(),
      paid_by: paidBy.trim(),
      tax_rate: parseFloat(taxRate) / 100,
      service_charge: parseFloat(serviceCharge) / 100,
      items: validItems,
    };

    if (editingBillId) {
      setBills(bills.map((b) => (b.id === editingBillId ? bill : b)));
    } else {
      setBills([...bills, bill]);
    }

    setShowModal(false);
    resetForm();
  }, [paidBy, items, editingBillId, taxRate, serviceCharge, bills, resetForm]);

  const handleAddItem = useCallback(() => {
    setItems([...items, { name: "", price: 0, quantity: 1, consumed_by: [] }]);
  }, [items]);

  const handleDeleteItem = useCallback(
    (index) => {
      if (items.length > 1) {
        setItems(items.filter((_, i) => i !== index));
      }
    },
    [items],
  );

  const handleItemChange = useCallback(
    (index, field, value) => {
      const newItems = [...items];
      if (field === "consumed_by") {
        newItems[index][field] = value;
      } else {
        newItems[index][field] = value;
      }
      setItems(newItems);
    },
    [items],
  );

  const handleConsumerKeyDown = useCallback(
    (index, e) => {
      if (e.key === "Enter" && e.target.value.trim()) {
        e.preventDefault();
        const newItems = [...items];
        const currentConsumers = newItems[index].consumed_by || [];
        const newConsumer = e.target.value.trim();

        if (!currentConsumers.includes(newConsumer)) {
          newItems[index].consumed_by = [...currentConsumers, newConsumer];
          setItems(newItems);
        }
        e.target.value = "";
      }
    },
    [items],
  );

  const removeConsumer = useCallback(
    (itemIndex, consumerName) => {
      const newItems = [...items];
      newItems[itemIndex].consumed_by = newItems[itemIndex].consumed_by.filter((c) => c !== consumerName);
      setItems(newItems);
    },
    [items],
  );

  const handleUploadReceipt = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/api/v1/bills/ocr", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("OCR request failed");
      }

      const ocrData = await response.json();

      setTaxRate((ocrData.tax_rate * 100).toString());
      setServiceCharge((ocrData.service_charge * 100).toString());
      setItems(
        ocrData.items.map((item) => ({
          ...item,
          consumed_by: [],
        })),
      );

      alert("Receipt scanned! Please add who consumed each item.");
    } catch (error) {
      console.error("OCR error:", error);
      alert("Failed to scan receipt. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleCalculateSplit = async () => {
    if (bills.length === 0) {
      alert("Please add at least one bill");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/v1/bills/split", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bills }),
      });

      if (!response.ok) {
        throw new Error("Split calculation failed");
      }

      const result = await response.json();

      setPaymentPlans(result.payment_plans);
      setShowResults(true);
    } catch (error) {
      console.error("Split calculation error:", error);
      alert("Failed to calculate split. Please try again.");
    }
  };

  const BillCard = ({ bill }) => {
    const totalItems = bill.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalWithFees = totalItems * (1 + bill.tax_rate + bill.service_charge);

    return (
      <div className="group border-2 border-gray-900 dark:border-gray-200 p-6 mb-4 hover:border-gray-700 dark:hover:border-gray-400 transition-all duration-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-xs text-gray-700 dark:text-gray-400 mb-1 font-mono tracking-wider">PAID BY</div>
            <h3 className="text-lg font-normal text-gray-900 dark:text-gray-100">{bill.paid_by}</h3>
            <p className="text-base text-gray-900 dark:text-gray-100 font-mono mt-1">₹{totalWithFees.toFixed(2)}</p>
          </div>
          <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => handleEditBill(bill)}
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors p-2"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              onClick={() => handleDeleteBill(bill.id)}
              className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2"
              title="Delete"
            >
              <Trash2 size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="space-y-1.5 mb-4 text-sm">
          {bill.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-gray-800 dark:text-gray-200">
              <span>
                {item.quantity} × {item.name}
              </span>
              <span className="font-mono">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {(bill.tax_rate > 0 || bill.service_charge > 0) && (
          <div className="pt-3 border-t-2 border-gray-300 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-400 font-mono space-x-4 tracking-wider">
            {bill.tax_rate > 0 && <span>tax: {(bill.tax_rate * 100).toFixed(0)}%</span>}
            {bill.service_charge > 0 && <span>service: {(bill.service_charge * 100).toFixed(0)}%</span>}
          </div>
        )}
      </div>
    );
  };

  const BillModal = useMemo(
    () => (
      <div
        className={`${showModal ? "block" : "hidden"} lg:block bg-white dark:bg-stone-900 border-2 border-gray-900 dark:border-gray-200 lg:h-full overflow-y-auto`}
      >
        <div className="border-b-2 border-gray-900 dark:border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-lg font-normal text-gray-900 dark:text-gray-100">
            {editingBillId ? "edit bill" : "new bill"}
          </h2>
          <button
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="border-2 border-dashed border-gray-400 dark:border-gray-600 p-4 hover:border-gray-900 dark:hover:border-gray-300 transition-colors">
            <label className="flex items-center gap-3 cursor-pointer">
              <Upload size={18} className="text-gray-700 dark:text-gray-300" strokeWidth={2} />
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {isUploading ? "scanning receipt..." : "upload receipt"}
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-400 mt-0.5">auto-fill using OCR</p>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleUploadReceipt}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>

          <div>
            <label className="block text-xs text-gray-700 dark:text-gray-400 mb-2 font-mono tracking-wider">
              PAID BY
            </label>
            <input
              type="text"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              placeholder="enter name"
              className="w-full px-0 py-2 bg-transparent border-b-2 border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-gray-300 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs text-gray-700 dark:text-gray-400 mb-2 font-mono tracking-wider">
                TAX (%)
              </label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="5.0"
                className="w-full px-0 py-2 bg-transparent border-b-2 border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-gray-300 transition-colors font-mono"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700 dark:text-gray-400 mb-2 font-mono tracking-wider">
                SERVICE (%)
              </label>
              <input
                type="number"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(e.target.value)}
                placeholder="10.0"
                className="w-full px-0 py-2 bg-transparent border-b-2 border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-gray-300 transition-colors font-mono"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs text-gray-700 dark:text-gray-400 font-mono tracking-wider">ITEMS</h3>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border-2 border-gray-300 dark:border-gray-700 p-4 relative">
                  <button
                    onClick={() => handleDeleteItem(index)}
                    disabled={items.length === 1}
                    className="absolute top-3 right-3 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </button>

                  <div className="space-y-4 pr-8">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, "name", e.target.value)}
                      placeholder="item name"
                      className="w-full px-0 py-2 bg-transparent border-b-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-gray-300 transition-colors"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        value={item.price || ""}
                        onChange={(e) => handleItemChange(index, "price", parseFloat(e.target.value) || 0)}
                        placeholder="price"
                        className="w-full px-0 py-2 bg-transparent border-b-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-gray-300 transition-colors font-mono"
                        min="0"
                        step="0.01"
                      />
                      <input
                        type="number"
                        value={item.quantity || ""}
                        onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                        placeholder="qty"
                        className="w-full px-0 py-2 bg-transparent border-b-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-gray-300 transition-colors font-mono"
                        min="1"
                      />
                    </div>

                    <div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {item.consumed_by.map((consumer, cIndex) => (
                          <span
                            key={cIndex}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm border border-gray-300 dark:border-gray-700"
                          >
                            {consumer}
                            <button
                              onClick={() => removeConsumer(index, consumer)}
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                            >
                              <X size={14} strokeWidth={2} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        onKeyDown={(e) => handleConsumerKeyDown(index, e)}
                        placeholder="consumed by"
                        className="w-full px-0 py-2 bg-transparent border-b-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-gray-300 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddItem}
              className="w-full mt-4 py-3 border-2 border-dashed border-gray-400 dark:border-gray-600 text-gray-800 dark:text-gray-300 hover:border-gray-900 dark:hover:border-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Plus size={16} strokeWidth={2} />
              add item
            </button>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSaveBill}
              className="flex-1 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              save bill
            </button>
            <button
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="px-6 py-3 border-2 border-gray-400 dark:border-gray-600 text-gray-800 dark:text-gray-300 hover:border-gray-900 dark:hover:border-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              cancel
            </button>
          </div>
        </div>
      </div>
    ),
    [
      showModal,
      editingBillId,
      isUploading,
      paidBy,
      taxRate,
      serviceCharge,
      items,
      handleAddItem,
      handleDeleteItem,
      handleItemChange,
      handleConsumerKeyDown,
      removeConsumer,
      handleSaveBill,
      resetForm,
      handleUploadReceipt,
    ],
  );

  const PaymentPlansView = () => {
    const plansWithPayments = paymentPlans.filter((plan) => plan.payments.length > 0);

    return (
      <div className="bg-white dark:bg-stone-900 border-2 border-gray-900 dark:border-gray-200 h-full overflow-y-auto">
        <div className="border-b-2 border-gray-900 dark:border-gray-200 p-6">
          <h2 className="text-lg font-normal text-gray-900 dark:text-gray-100">payment plans</h2>
        </div>

        <div className="p-6 space-y-6">
          {plansWithPayments.map((plan, index) => {
            const totalToPay = plan.payments.reduce((sum, p) => sum + p.amount, 0);

            return (
              <div key={index} className="border-2 border-gray-300 dark:border-gray-700 p-6">
                <div className="mb-4">
                  {/* <div className="text-xs text-gray-700 dark:text-gray-400 mb-1 font-mono tracking-wider">OWES</div>*/}
                  <h3 className="text-lg font-mono text-gray-900 dark:text-gray-100">{plan.name}</h3>
                  <p className="text-base text-gray-900 dark:text-gray-100 font-mono mt-1">
                    owes ₹{totalToPay.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  {plan.payments.map((payment, pIndex) => (
                    <div
                      key={pIndex}
                      className="flex items-center justify-between py-2 text-sm border-t-2 border-gray-300 dark:border-gray-700"
                    >
                      <span className="text-gray-800 dark:text-gray-200 font-mono font-semibold">→ {payment.to}</span>
                      <span className="text-gray-900 dark:text-gray-100 font-mono">₹{payment.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <p className="text-xs text-gray-600 dark:text-gray-500 text-center pt-4">modify bills to recalculate</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-stone-900 p-6 lg:p-8 transition-colors">
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-2">
          <Receipt size={24} className="text-gray-900 dark:text-gray-100" strokeWidth={2} />
          <h1 className="text-2xl font-normal text-gray-900 dark:text-gray-100">bill splitter</h1>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-400">split bills fairly among friends</p>
      </div>

      <div className="max-w-7xl mx-auto">
        {!isMobile && (
          <div className="grid grid-cols-2 gap-8" style={{ height: "calc(100vh - 200px)" }}>
            <div className="border-2 border-gray-900 dark:border-gray-200 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-normal text-gray-900 dark:text-gray-100">bills</h2>
                <span className="text-xs text-gray-700 dark:text-gray-400 font-mono">{bills.length}</span>
              </div>

              <button
                onClick={handleAddBill}
                className="w-full py-3 mb-6 border-2 border-dashed border-gray-400 dark:border-gray-600 text-gray-800 dark:text-gray-300 hover:border-gray-900 dark:hover:border-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Plus size={16} strokeWidth={2} />
                add new bill
              </button>

              {bills.length === 0 ? (
                <div className="text-center py-16">
                  <Receipt size={32} className="mx-auto mb-4 text-gray-400 dark:text-gray-600" strokeWidth={2} />
                  <p className="text-gray-600 dark:text-gray-500 text-sm">no bills yet</p>
                </div>
              ) : (
                bills.map((bill) => <BillCard key={bill.id} bill={bill} />)
              )}

              <button
                onClick={handleCalculateSplit}
                className="w-full mt-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={bills.length === 0}
              >
                calculate split
              </button>
            </div>

            <div>
              {showModal && BillModal}
              {showResults && <PaymentPlansView />}
              {!showModal && !showResults && (
                <div className="border-2 border-dashed border-gray-400 dark:border-gray-600 h-full flex flex-col items-center justify-center p-12">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center">
                      <Receipt size={24} className="text-gray-400 dark:text-gray-600" strokeWidth={2} />
                    </div>
                    <p className="text-gray-600 dark:text-gray-500 text-sm">add bills or calculate split</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isMobile && (
          <div>
            {!showModal && !showResults && (
              <div className="border-2 border-gray-900 dark:border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-normal text-gray-900 dark:text-gray-100">bills</h2>
                  <span className="text-xs text-gray-700 dark:text-gray-400 font-mono">{bills.length}</span>
                </div>

                <button
                  onClick={handleAddBill}
                  className="w-full py-3 mb-6 border-2 border-dashed border-gray-400 dark:border-gray-600 text-gray-800 dark:text-gray-300 hover:border-gray-900 dark:hover:border-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Plus size={16} strokeWidth={2} />
                  add new bill
                </button>

                {bills.length === 0 ? (
                  <div className="text-center py-16">
                    <Receipt size={32} className="mx-auto mb-4 text-gray-400 dark:text-gray-600" strokeWidth={2} />
                    <p className="text-gray-600 dark:text-gray-500 text-sm">no bills yet</p>
                  </div>
                ) : (
                  bills.map((bill) => <BillCard key={bill.id} bill={bill} />)
                )}

                <button
                  onClick={handleCalculateSplit}
                  className="w-full mt-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={bills.length === 0}
                >
                  calculate split
                </button>
              </div>
            )}

            {showModal && (
              <div className="fixed inset-0 bg-white dark:bg-stone-900 z-50 overflow-y-auto">{BillModal}</div>
            )}

            {showResults && (
              <div className="space-y-6">
                <button
                  onClick={() => setShowResults(false)}
                  className="w-full py-3 border-2 border-gray-400 dark:border-gray-600 text-gray-800 dark:text-gray-300 hover:border-gray-900 dark:hover:border-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} strokeWidth={2} />
                  back to bills
                </button>
                <PaymentPlansView />
                <button
                  onClick={handleAddBill}
                  className="w-full py-3 border-2 border-dashed border-gray-400 dark:border-gray-600 text-gray-800 dark:text-gray-300 hover:border-gray-900 dark:hover:border-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Plus size={16} strokeWidth={2} />
                  add new bill
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillSplitter;
