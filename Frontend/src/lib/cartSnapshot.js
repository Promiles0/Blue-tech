// What a guest cart line needs to render without the server: call with the product
// and the chosen variant from the product page / quick view.
export function cartSnapshot(product, variant) {
  const image = product?.primaryImageUrl ?? product?.imageUrl ?? product?.images?.[0]?.imageUrl ?? null
  return {
    unitPrice: (parseFloat(product?.price) || 0) + (parseFloat(variant?.priceAdjustment) || 0),
    productName: product?.name ?? 'Product',
    sizeOrColor: variant?.sizeOrColor ?? null,
    skuCode: variant?.skuCode ?? null,
    stockQuantity: variant?.stockQuantity ?? null,
    product: { productId: product?.productId ?? product?.id, name: product?.name, imageUrl: image, primaryImageUrl: image },
  }
}
