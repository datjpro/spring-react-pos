package com.pos.services;

import com.pos.common.exception.DuplicateResourceException;
import com.pos.common.exception.ResourceNotFoundException;
import com.pos.dtos.request.SupplierRequest;
import com.pos.dtos.response.SupplierResponse;
import com.pos.entities.SupplierEntity;
import com.pos.repositories.SupplierRepository;
import com.pos.services.impl.SupplierServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SupplierServiceImplTest {

    @Mock
    private SupplierRepository supplierRepository;

    @InjectMocks
    private SupplierServiceImpl supplierService;

    @Test
    void shouldCreateSupplierSuccessfully() {
        SupplierRequest request = new SupplierRequest("NCC-01", "Supplier", "090", "s@example.com", "Address");
        SupplierEntity entity = new SupplierEntity();
        entity.setId(1L);
        entity.setCode("NCC-01");
        entity.setName("Supplier");
        entity.setPhone("090");
        entity.setEmail("s@example.com");
        entity.setAddress("Address");
        entity.setActive(true);

        when(supplierRepository.existsByCodeIgnoreCase("NCC-01")).thenReturn(false);
        when(supplierRepository.save(any(SupplierEntity.class))).thenReturn(entity);

        SupplierResponse response = supplierService.create(request);

        assertEquals("NCC-01", response.code());
        assertEquals("Supplier", response.name());
    }

    @Test
    void shouldThrowDuplicateWhenCodeExists() {
        SupplierRequest request = new SupplierRequest("NCC-01", "Supplier", "090", "s@example.com", "Address");
        when(supplierRepository.existsByCodeIgnoreCase("NCC-01")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> supplierService.create(request));
    }

    @Test
    void shouldFindSupplierByIdSuccessfully() {
        SupplierEntity entity = new SupplierEntity();
        entity.setId(1L);
        entity.setCode("NCC-01");
        entity.setName("Supplier");
        entity.setPhone("090");
        entity.setEmail("s@example.com");
        entity.setAddress("Address");
        entity.setActive(true);

        when(supplierRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(entity));

        SupplierResponse response = supplierService.findById(1L);

        assertEquals(1L, response.id());
        assertEquals("NCC-01", response.code());
    }

    @Test
    void shouldThrowNotFoundWhenSupplierMissing() {
        when(supplierRepository.findByIdAndActiveTrue(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> supplierService.findById(99L));
    }

    @Test
    void shouldFindAllActiveSuppliersSuccessfully() {
        SupplierEntity entity = new SupplierEntity();
        entity.setId(1L);
        entity.setCode("NCC-01");
        entity.setName("Supplier");
        entity.setActive(true);

        when(supplierRepository.findByActiveTrueOrderByNameAsc()).thenReturn(List.of(entity));

        List<SupplierResponse> responses = supplierService.findAll();

        assertEquals(1, responses.size());
        assertEquals("NCC-01", responses.get(0).code());
    }

    @Test
    void shouldSoftDeleteSupplierSuccessfully() {
        SupplierEntity entity = new SupplierEntity();
        entity.setId(1L);
        entity.setActive(true);

        when(supplierRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(entity));

        supplierService.delete(1L);

        assertFalse(entity.isActive());
        verify(supplierRepository).findByIdAndActiveTrue(1L);
    }
}
