package com.jyotisales.service;

import com.jyotisales.dto.AddressRequest;
import com.jyotisales.entity.Address;
import com.jyotisales.entity.User;
import com.jyotisales.exception.ApiException;
import com.jyotisales.repository.AddressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;

    public List<Address> list(Long userId) {
        return addressRepository.findByUserId(userId);
    }

    @Transactional
    public Address add(Long userId, AddressRequest req) {
        Address address = new Address();
        User ref = new User();
        ref.setId(userId);
        address.setUser(ref);
        apply(address, req);
        return addressRepository.save(address);
    }

    @Transactional
    public Address update(Long userId, Long addressId, AddressRequest req) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> ApiException.notFound("Address not found"));
        if (!address.getUser().getId().equals(userId)) throw ApiException.forbidden("Not your address");
        apply(address, req);
        return addressRepository.save(address);
    }

    @Transactional
    public void delete(Long userId, Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> ApiException.notFound("Address not found"));
        if (!address.getUser().getId().equals(userId)) throw ApiException.forbidden("Not your address");
        addressRepository.delete(address);
    }

    private void apply(Address a, AddressRequest req) {
        a.setLabel(req.label());
        a.setRecipientName(req.recipientName());
        a.setPhone(req.phone());
        a.setLine1(req.line1());
        a.setLine2(req.line2());
        a.setCity(req.city());
        a.setState(req.state());
        a.setPincode(req.pincode());
        a.setDefault(req.isDefault());
    }
}
